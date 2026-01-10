import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import { TranslationService } from '../../services/translation/translation.service';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { environment } from '../../../environments/environment';
import moment from 'moment';
import * as Papa from 'papaparse';

interface ImportField {
  name: string;
  mapped_value: string;
}

interface Field {
  label: string;
  value: string;
}

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatStepperModule,
    MatCardModule,
    MatDividerModule,
    TranslateModule
  ]
})
export class ImportComponent {
  public dialogRef = inject(MatDialogRef<ImportComponent>);
  public data = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private accountService = inject(AccountService);
  private diaryService = inject(DiaryService);
  private snackBar = inject(MatSnackBar);
  private translationService = inject(TranslationService);

  public account = signal<any>(null);
  public importType = signal<string>('');
  public currentStep = signal<number>(0);
  public selectedFile = signal<File | null>(null);
  public uploadedFile = signal<any>(null);
  public importedCount = signal<number>(0);
  public selectedFields = signal<string[]>([]);
  public importedFields = signal<ImportField[]>([]);
  public previousImports = signal<any[]>([]);
  public isUploading = signal<boolean>(false);
  public isImporting = signal<boolean>(false);

  public fields: Field[] = [
    { label: 'Exercise', value: 'exercise' },
    { label: 'Reps', value: 'reps' },
    { label: 'Weight', value: 'weight' },
    { label: 'Percentage', value: 'percentage' },
    { label: 'RPE', value: 'rpe' },
    { label: 'Unit', value: 'unit' },
    { label: 'Set', value: 'sets' },
    { label: 'Date', value: 'assigneddate' },
    { label: 'Notes', value: 'notes' },
    { label: 'Rest Duration', value: 'rest' },
    { label: 'Time', value: 'time' },
    { label: 'Distance', value: 'distance' },
    { label: 'Distance Unit', value: 'distanceunit' }
  ];

  constructor() {
    this.accountService.getAccountLocal().then((account: any) => {
      if (account) {
        this.account.set(account);
      }
    });

    this.getPreviousImports();
  }

  private async getPreviousImports(): Promise<void> {
    try {
      const data = await this.diaryService.getImports();
      this.previousImports.set(data || []);
    } catch (error) {
      console.error('Error loading previous imports:', error);
    }
  }

  public async selectFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    if (!file.name.endsWith('.csv')) {
      this.snackBar.open(
        this.translationService.instant('Please select a CSV file'),
        '',
        { duration: 3000 }
      );
      return;
    }

    this.selectedFile.set(file);
    this.isUploading.set(true);

    try {
      const account = this.account();
      if (!account || !account.id) {
        throw new Error('No account found');
      }

      const result = await this.diaryService.uploadImport(file, account.id);
      this.uploadedFile.set({ url: result });

      // Parse CSV data
      const csvData = await this.diaryService.getCSVData(result);
      const parsedData = this.parseCSV(csvData);

      this.importedCount.set(parsedData.data.length);

      if (this.importType() === 'other' || !this.importType()) {
        this.importedFields.set(this.mapFields(parsedData.fields));
        this.setSelectedFields();
        this.currentStep.set(1);
      } else {
        this.currentStep.set(1);
      }

      this.isUploading.set(false);
    } catch (error) {
      this.isUploading.set(false);
      this.snackBar.open(
        this.translationService.instant('There was an error uploading your file'),
        '',
        { duration: 5000 }
      );
      console.error('Upload error:', error);
    }
  }

  private parseCSV(csvData: string): { data: any[]; fields: string[]; delimiter: string } {
    const parsedCsvData = Papa.parse(csvData, {
      skipEmptyLines: true,
      header: true
    });

    // Store delimiter in uploaded file
    const currentUploadedFile = this.uploadedFile();
    if (currentUploadedFile) {
      currentUploadedFile.delimiter = parsedCsvData.meta.delimiter;
      this.uploadedFile.set(currentUploadedFile);
    }

    return {
      data: parsedCsvData.data as any[],
      fields: parsedCsvData.meta.fields || [],
      delimiter: parsedCsvData.meta.delimiter || ','
    };
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
          (searchCsvField.includes(searchFieldLabel) ||
            searchCsvField.includes(searchFieldValue) ||
            searchFieldLabel.includes(searchCsvField) ||
            searchFieldValue.includes(searchCsvField)) &&
          !assignedFields.includes(field.value)
        ) {
          // Handle special cases
          if (searchCsvField === 'unit' && searchFieldValue === 'distanceunit') {
            continue;
          } else if (searchCsvField === 'set type' && searchFieldValue === 'set') {
            continue;
          } else if (searchCsvField === 'exercise' && searchFieldValue === 'exerciseid') {
            continue;
          } else {
            mappedField.mapped_value = field.value;
            assignedFields.push(field.value);
            break;
          }
        }
      }

      mappedFields.push(mappedField);
    }

    return mappedFields;
  }

  public setSelectedFields(): void {
    const mappedValuesSet = new Set(
      this.importedFields()
        .filter(field => field.mapped_value)
        .map(field => field.mapped_value)
    );
    const selectedFieldValues = this.fields
      .filter(field => mappedValuesSet.has(field.value))
      .map(field => field.value);

    this.selectedFields.set(selectedFieldValues);
  }

  public onFieldMappingChange(): void {
    this.setSelectedFields();
  }

  public async startImport(): Promise<void> {
    const importType = this.importType();
    const selectedFields = this.selectedFields();

    // Validate required fields for custom imports
    if (
      (importType === 'other' || !importType) &&
      (!selectedFields.includes('assigneddate') || !selectedFields.includes('exercise'))
    ) {
      this.snackBar.open(
        this.translationService.instant('You must assign a field to the date and exercise columns in Intensity'),
        '',
        { duration: 5000 }
      );
      return;
    }

    const confirmMessage = this.translationService.instant('You are about to import') +
      ' ' +
      this.importedCount() +
      ' ' +
      this.translationService.instant(this.importedCount() === 1 ? 'record' : 'records') +
      ' ' +
      this.translationService.instant('into your diary. Are you sure you want to continue?');

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: this.translationService.instant('Confirm Import'),
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
    this.isImporting.set(true);

    try {
      const baseUrl = environment.apiUrl.replace('index.php', '');
      let url = this.uploadedFile()?.url || '';

      if (url && url.includes(baseUrl)) {
        url = url.replace(baseUrl, '');
      }

      const uploadedFile = this.uploadedFile();
      await this.diaryService.importFile(
        url,
        uploadedFile?.delimiter || ',',
        JSON.stringify(this.importedFields()),
        this.importType()
      );

      this.isImporting.set(false);
      this.snackBar.open(
        this.translationService.instant('Your records have been imported into your diary'),
        '',
        { duration: 5000 }
      );

      // Notify diary to refresh
      this.diaryService.setDiaryObservable({ update: true });

      // Refresh previous imports
      await this.getPreviousImports();

      // Reset form
      this.resetForm();
    } catch (error) {
      this.isImporting.set(false);
      this.snackBar.open(
        this.translationService.instant('There was an error importing this data. Please try again'),
        '',
        { duration: 5000 }
      );
      console.error('Import error:', error);
    }
  }

  private resetForm(): void {
    this.currentStep.set(0);
    this.selectedFile.set(null);
    this.uploadedFile.set(null);
    this.importType.set('');
    this.importedCount.set(0);
    this.selectedFields.set([]);
    this.importedFields.set([]);
  }

  public async removeImport(addId: number, index: number): Promise<void> {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: this.translationService.instant('Remove Import'),
        content: this.translationService.instant('Are you sure you want to remove this import?')
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

        await this.diaryService.removeProgram(addId);
        this.diaryService.setDiaryObservable({ update: true });

        this.snackBar.open(
          this.translationService.instant('Import removed'),
          '',
          { duration: 3000 }
        );
      } catch (error) {
        this.snackBar.open(
          this.translationService.instant('Error removing import'),
          '',
          { duration: 3000 }
        );
        console.error('Remove import error:', error);
      }
    });
  }

  public formatDate(date: string): string {
    return moment(date)
      .locale(this.translationService.currentLanguage())
      .format('MMMM Do YYYY');
  }

  public goToStep(step: number): void {
    const importType = this.importType();
    
    if (step === 1) {
      this.currentStep.set(0);
    } else if (step === 2 && this.selectedFile()) {
      if (importType === 'other' || !importType) {
        this.currentStep.set(1);
      } else {
        this.currentStep.set(1); // Skip to import for non-custom types
      }
    } else if (step === 3 && this.selectedFile()) {
      if (importType === 'other' || !importType) {
        this.currentStep.set(2);
      } else {
        this.currentStep.set(1);
      }
    }
  }

  public dismiss(): void {
    this.dialogRef.close();
  }
}
