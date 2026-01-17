import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-change-email',
  templateUrl: './change-email.component.html',
  styleUrls: ['./change-email.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ChangeEmailComponent {
    
    public dialogRef = inject(MatDialogRef<ChangeEmailComponent>);
    public data = inject<{ email?: string }>(MAT_DIALOG_DATA);

    public user: any; 
    
    constructor() {
        this.user = {
            new_email: this.data?.email || '',
            confirm_email: ''
        }
    }
    
    public change(): void {
        this.dialogRef.close(this.user);
    } 
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
