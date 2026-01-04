import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ImportComponent {
    
    public dialogRef = inject(MatDialogRef<ImportComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    public account: any; 
    public import: any;
    
    constructor() {
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
        
        this.import = {type:"fitnotes", file:"", filename:""};
    }
    
    public selectFile($event: any): void {
        const files = $event.srcElement.files;
        const mediaFile: File = files[0];
        
        this.import.filename = mediaFile.name;
        this.import.file = mediaFile;
     }

    public uploadFile(): void {
        document.getElementById('csvFile')?.click();
    }     
    
    public importData(): void {
        this.dialogRef.close(this.import);
    } 
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
