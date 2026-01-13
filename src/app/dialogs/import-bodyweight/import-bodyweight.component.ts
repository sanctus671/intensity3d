import { Component, OnInit, inject, signal, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';
import * as Papa from 'papaparse';

import { BodyweightService } from '../../services/bodyweight/bodyweight.service';
import { AccountService } from '../../services/account/account.service';
import { ThemeService } from '../../services/theme/theme.service';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { environment } from '../../../environments/environment';

interface ImportField {
  name: string;
  mapped_value: string;
}

interface UploadedFile {
  url: string;
  delimiter?: string;
}

@Component({
  selector: 'app-import-bodyweight',
  templateUrl: './import-bodyweight.component.html',
  styleUrls: ['./import-bodyweight.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatStepperModule,
    MatCardModule,
    MatDividerModule,
    TranslateModule
  ]
})
export class ImportBodyweightComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<ImportBodyweightComponent>);
  private readonly data = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly bodyweightService = inject(BodyweightService);
  private readonly accountService = inject(AccountService);
  private readonly translate = inject(TranslateService);
  public readonly themeService = inject(ThemeService);

  // ViewChild
  stepper = viewChild.required<MatStepper>('stepper');

  // Signals
  currentStep = signal<number>(0);
  selectedFile = signal<File | null>(null);
  uploadedFile = signal<UploadedFile | null>(null);
  importedCount = signal<number>(0);
  selectedFields = signal<string[]>([]);
  importedFields = signal<ImportField[]>([]);
  previousImports = signal<any[]>([]);
  user = signal<any>({});
  exportLoading = signal<boolean>(false);
  isUploading = signal<boolean>(false);
  isImporting = signal<boolean>(false);

  fields = [
    { label: this.translate.instant('Date'), value: 'created' },
    { label: this.translate.instant('Weight'), value: 'weight' }
  ];

  async ngOnInit(): Promise<void> {
    try {
      const account = await this.accountService.getAccountLocal();
      this.user.set(account || {});
      await this.loadPreviousImports();
    } catch (error) {
      console.error('Error initializing import dialog:', error);
    }
  }

  private async loadPreviousImports(): Promise<void> {
    try {
      const data = await this.bodyweightService.getImports();
      this.previousImports.set(data || []);
    } catch (error) {
      console.error('Error loading previous imports:', error);
    }
  }

  public dismiss(): void {
    this.dialogRef.close();
  }

  public async selectFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    if (!file.name.endsWith('.csv')) {
      alert(this.translate.instant('Please select a CSV file'));
      return;
    }

    this.selectedFile.set(file);
    await this.uploadFile(file);
  }

  private async uploadFile(file: File): Promise<void> {
    try {
      this.isUploading.set(true);
      
      const userId = this.data.userId || this.user().id;
      const result = await this.bodyweightService.uploadImport(file, userId);
      
      this.uploadedFile.set({ url: result as string });
      
      // Parse CSV
      const csvData = await this.bodyweightService.getCSVData(result as string);
      const parsedCsvData = Papa.parse(csvData, { 
        skipEmptyLines: true, 
        header: true 
      });
      
      const uploadedFileData = this.uploadedFile();
      if (uploadedFileData) {
        uploadedFileData.delimiter = parsedCsvData.meta.delimiter;
        this.uploadedFile.set({ ...uploadedFileData });
      }
      
      this.importedCount.set(parsedCsvData.data.length);
      this.importedFields.set(this.mapFields(parsedCsvData.meta.fields || []));
      this.setSelectedFields();
      this.currentStep.set(1);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(this.translate.instant('There was an error uploading your file.'));
      this.selectedFile.set(null);
    } finally {
      this.isUploading.set(false);
    }
  }

  private mapFields(csvFields: string[]): ImportField[] {
    const mappedFields: ImportField[] = [];
    const assignedFields: string[] = [];
    
    for (const csvField of csvFields) {
      const mappedField: ImportField = { name: csvField, mapped_value: '' };
      
      for (const field of this.fields) {
        const searchCsvField = csvField.toLowerCase();
        const searchFieldLabel = field.label.toLowerCase();
        const searchFieldValue = field.value.toLowerCase();
        
        if (
          (searchCsvField.indexOf(searchFieldLabel) > -1 ||
            searchCsvField.indexOf(searchFieldValue) > -1 ||
            searchFieldLabel.indexOf(searchCsvField) > -1 ||
            searchFieldValue.indexOf(searchCsvField) > -1) &&
          assignedFields.indexOf(field.value) < 0
        ) {
          mappedField.mapped_value = field.value;
          assignedFields.push(field.value);
          break;
        }
      }
      
      mappedFields.push(mappedField);
    }
    
    return mappedFields;
  }

  public setSelectedFields(): void {
    const mappedValuesSet = new Set(
      this.importedFields()
        .filter((field) => field.mapped_value)
        .map((field) => field.mapped_value)
    );
    
    const selectedFieldValues = this.fields
      .filter((field) => mappedValuesSet.has(field.value))
      .map((field) => field.value);
    
    this.selectedFields.set(selectedFieldValues);
  }

  public isFieldDisabled(fieldValue: string, currentMappedValue: string): boolean {
    return this.selectedFields().indexOf(fieldValue) > -1 && currentMappedValue !== fieldValue;
  }

  public async startImport(): Promise<void> {
    const selectedFields = this.selectedFields();
    if (selectedFields.indexOf('created') < 0 || selectedFields.indexOf('weight') < 0) {
      alert(this.translate.instant('You must assign a field to the date and weight columns.'));
      return;
    }

    const confirmMessage = this.translate.instant('You are about to import') +
      ' ' + this.importedCount() + ' ' +
      this.translate.instant(this.importedCount() === 1 ? 'record' : 'records') +
      ' ' + this.translate.instant('into your bodyweight log. Are you sure you want to continue?');

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: this.translate.instant('Confirm Import'),
        content: confirmMessage
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.confirm) {
        await this.doImport();
      }
    });
  }

  private async doImport(): Promise<void> {
    try {
      this.isImporting.set(true);
      
      const baseUrl = environment.apiUrl.replace('index.php', '');
      let url = this.uploadedFile()?.url || '';
      
      if (url && url.indexOf(baseUrl) > -1) {
        url = url.replace(baseUrl, '');
      }
      
      const uploadedFileData = this.uploadedFile();
      await this.bodyweightService.importFile(
        url,
        uploadedFileData?.delimiter || ',',
        JSON.stringify(this.importedFields())
      );
      
      alert(this.translate.instant('Your records have been imported into your bodyweight log.'));
      
      await this.loadPreviousImports();
      this.resetForm();
      this.dialogRef.close({ imported: true });
    } catch (error) {
      console.error('Error importing data:', error);
      alert(this.translate.instant('There was an error importing this data. Please try again.'));
    } finally {
      this.isImporting.set(false);
    }
  }

  private resetForm(): void {
    this.currentStep.set(0);
    this.selectedFile.set(null);
    this.uploadedFile.set(null);
    this.importedCount.set(0);
    this.selectedFields.set([]);
    this.importedFields.set([]);
  }

  public async removeImport(addId: number, index: number): Promise<void> {
    const confirmMessage = this.translate.instant('Are you sure you want to remove this import?');
    
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: this.translate.instant('Remove Import'),
        content: confirmMessage
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result || !result.confirm) {
        return;
      }

      try {
        const imports = this.previousImports();
        imports.splice(index, 1);
        this.previousImports.set([...imports]);
        
        await this.bodyweightService.removeImport(addId);
      } catch (error) {
        console.error('Error removing import:', error);
        this.snackBar.open(
          this.translate.instant('There was an error removing this import.'),
          '',
          { duration: 5000 }
        );
        await this.loadPreviousImports();
      }
    });
  }

  public formatDate(date: string): string {
    return moment(date)
      .locale(this.translate.getDefaultLang())
      .format('MMMM Do YYYY');
  }

  public async exportData(): Promise<void> {
    try {
      this.exportLoading.set(true);
      const userId = this.data.userId || this.user().id;
      const exportUrl = await this.bodyweightService.getExport(userId);
      
      // Download the export file
      window.open(environment.apiUrl.replace('index.php', '') + exportUrl, '_blank');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert(this.translate.instant('There was an error exporting your data.'));
    } finally {
      this.exportLoading.set(false);
    }
  }
}
