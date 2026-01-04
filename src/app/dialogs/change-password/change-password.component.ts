import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
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
export class ChangePasswordComponent {
    
    public dialogRef = inject(MatDialogRef<ChangePasswordComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    public user: any; 
    
    constructor() {
        this.user = {}
    }
    
    public change(): void {
        this.dialogRef.close(this.user);
    } 
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
