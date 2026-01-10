import { Component, OnInit, ChangeDetectionStrategy, signal, inject, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AccountService } from '../../../services/account/account.service';

interface PlateColor {
  id: string;
  label: string;
  kgLabel: string;
  lbsLabel: string;
  kgValue: string;
  lbsValue: string;
  color: string;
  textColor?: string;
}

@Component({
  selector: 'app-plate-color-settings',
  templateUrl: './plate-color-settings.component.html',
  styleUrls: ['./plate-color-settings.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    TranslateModule,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PlateColorSettingsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<PlateColorSettingsComponent>);
  private accountService = inject(AccountService);
  public translate = inject(TranslateService);

  plateColors = signal<PlateColor[]>([]);
  units = signal<string>('kg');

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { units?: string }
  ) {
    // Get units from data if provided
    if (data?.units) {
      this.units.set(data.units);
    }

    // Initialize plate colors with translations
    this.plateColors.set(this.getDefaultPlateColors());
  }

  async ngOnInit(): Promise<void> {
    // If units not provided in data, try to get from account
    if (!this.data?.units) {
      this.accountService.getAccountObservable().subscribe((account: any) => {
        if (account && account.units) {
          this.units.set(account.units);
        }
      });
    }

    // Load saved colors
    const savedColors = await this.accountService.getPlateColors();
    if (savedColors) {
      const colors = JSON.parse(savedColors);
      this.plateColors.update(plates => plates.map(plate => ({
        ...plate,
        color: colors[plate.id]?.color || plate.color,
        textColor: colors[plate.id]?.textColor || plate.textColor
      })));
    }
    
    // Apply colors for preview
    this.applyColors();
  }

  cancel(): void {
    this.dialogRef.close();
  }

  async save(): Promise<void> {
    // Convert array to object for easier lookup
    const colorsObject: any = {};
    this.plateColors().forEach(plate => {
      colorsObject[plate.id] = {
        color: plate.color,
        textColor: plate.textColor
      };
    });

    await this.accountService.setPlateColors(colorsObject);
    
    // Apply CSS variables immediately
    this.applyColors();
    
    this.dialogRef.close({ colors: colorsObject });
  }

  private getDefaultPlateColors(): PlateColor[] {
    return [
      { id: '25kg-55lbs', label: '25kg / 55lbs', kgLabel: '25kg', lbsLabel: '55lbs', kgValue: '25kg', lbsValue: '55lbs', color: '#AC333A', textColor: '#FFFFFF' },
      { id: '20kg-45lbs', label: '20kg / 45lbs', kgLabel: '20kg', lbsLabel: '45lbs', kgValue: '20kg', lbsValue: '45lbs', color: '#194C96', textColor: '#FFFFFF' },
      { id: '15kg-35lbs', label: '15kg / 35lbs', kgLabel: '15kg', lbsLabel: '35lbs', kgValue: '15kg', lbsValue: '35lbs', color: '#ffdb2c', textColor: '#000000' },
      { id: '10kg-25lbs', label: '10kg / 25lbs', kgLabel: '10kg', lbsLabel: '25lbs', kgValue: '10kg', lbsValue: '25lbs', color: '#3A8459', textColor: '#FFFFFF' },
      { id: '5kg-10lbs', label: '5kg / 10lbs', kgLabel: '5kg', lbsLabel: '10lbs', kgValue: '5kg', lbsValue: '10lbs', color: '#FAFAFA', textColor: '#000000' },
      { id: '2point5kg-5lbs', label: '2.5kg / 5lbs', kgLabel: '2.5kg', lbsLabel: '5lbs', kgValue: '2.5kg', lbsValue: '5lbs', color: '#545454', textColor: '#FFFFFF' },
      { id: '1point25kg-2point5lbs', label: '1.25kg / 2.5lbs', kgLabel: '1.25kg', lbsLabel: '2.5lbs', kgValue: '1.25kg', lbsValue: '2.5lbs', color: '#9F9F9F', textColor: '#FFFFFF' },
      { id: 'smaller', label: this.translate.instant('Smaller plates'), kgLabel: this.translate.instant('Smaller plates'), lbsLabel: this.translate.instant('Smaller plates'), kgValue: '<1.25kg', lbsValue: '<2.5lbs', color: '#E9E9E7', textColor: '#000000' },
      { id: 'larger', label: this.translate.instant('Larger plates'), kgLabel: this.translate.instant('Larger plates'), lbsLabel: this.translate.instant('Larger plates'), kgValue: '>25kg', lbsValue: '>55lbs', color: '#1a1a1a', textColor: '#FFFFFF' },
    ];
  }

  resetToDefaults(): void {
    this.plateColors.set(this.getDefaultPlateColors());
    this.applyColors();
  }

  private applyColors(): void {
    const root = document.documentElement;
    this.plateColors().forEach(plate => {
      root.style.setProperty(`--plate-color-${plate.id}`, plate.color);
      if (plate.textColor) {
        root.style.setProperty(`--plate-text-color-${plate.id}`, plate.textColor);
      }
    });
  }

  trackByPlateId(index: number, plate: PlateColor): string {
    return plate.id;
  }

  onColorChange(): void {
    // Apply colors immediately for live preview
    this.applyColors();
  }

  updatePlateColor(index: number, field: 'color' | 'textColor', value: string): void {
    this.plateColors.update(plates => {
      const updated = [...plates];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    this.onColorChange();
  }
}

