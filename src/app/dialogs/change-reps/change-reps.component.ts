import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-change-reps',
  templateUrl: './change-reps.component.html',
  styleUrls: ['./change-reps.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ]
})
export class ChangeRepsComponent {
  public dialogRef = inject(MatDialogRef<ChangeRepsComponent>);
  public data = inject(MAT_DIALOG_DATA);

  public reps: number;

  constructor() {
    this.reps = this.data.reps || 1;
  }

  public update(): void {
    if (this.reps && this.reps > 0) {
      this.dialogRef.close({ reps: this.reps });
    }
  }

  public dismiss(): void {
    this.dialogRef.close();
  }
}
