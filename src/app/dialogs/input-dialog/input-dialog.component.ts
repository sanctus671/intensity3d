import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-input-dialog',
  templateUrl: './input-dialog.component.html',
  styleUrls: ['./input-dialog.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule
  ]
})
export class InputDialogComponent {
    
    public dialogRef = inject(MatDialogRef<InputDialogComponent>);
    public data = inject(MAT_DIALOG_DATA);
    
    public title: string;
    public message: string;
    public inputValue: string;
    public inputType: string;
    public placeholder: string;
    
    constructor() {
        this.title = this.data.title || 'Input';
        this.message = this.data.message || '';
        this.inputValue = this.data.defaultValue || '';
        this.inputType = this.data.inputType || 'text';
        this.placeholder = this.data.placeholder || '';
    }
 
    public confirm(): void {
        this.dialogRef.close({ value: this.inputValue });
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
