import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weight-converter',
  templateUrl: './weight-converter.component.html',
  styleUrls: ['./weight-converter.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    TranslateModule,
    FormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WeightConverterComponent {
  kgValue = signal<number | null>(null);
  lbsValue = signal<number | null>(null);

  constructor(
    private dialogRef: MatDialogRef<WeightConverterComponent>
  ) { }

  cancel(): void {
    this.dialogRef.close();
  }

  onKgChange(value: string): void {
    const kg = value ? parseFloat(value) : null;
    this.kgValue.set(kg);
    
    if (kg !== null && kg >= 0) {
      // Convert kg to lbs: 1 kg = 2.20462 lbs
      this.lbsValue.set(Math.round(kg * 2.20462 * 100) / 100);
    } else {
      this.lbsValue.set(null);
    }
  }

  onLbsChange(value: string): void {
    const lbs = value ? parseFloat(value) : null;
    this.lbsValue.set(lbs);
    
    if (lbs !== null && lbs >= 0) {
      // Convert lbs to kg: 1 lbs = 0.453592 kg
      this.kgValue.set(Math.round(lbs * 0.453592 * 100) / 100);
    } else {
      this.kgValue.set(null);
    }
  }

  clearValues(): void {
    this.kgValue.set(null);
    this.lbsValue.set(null);
  }
}


