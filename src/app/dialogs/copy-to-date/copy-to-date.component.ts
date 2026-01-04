import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';

@Component({
  selector: 'app-copy-to-date',
  templateUrl: './copy-to-date.component.html',
  styleUrls: ['./copy-to-date.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    TranslateModule
  ],
  providers: [provideNativeDateAdapter()]
})
export class CopyToDateComponent {
    
    public dialogRef = inject(MatDialogRef<CopyToDateComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    public details: any;
    public account: any;
    
    constructor() {
        //date = to date, assigneddate = from date
        this.details = {type:"workout", date:new Date(), userid:""}
        
        if (this.data.exercise){
            this.details.type = "sets";
            this.details.exerciseid = this.data.exercise.exerciseid;
        }
        
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
            this.details.userid = account.id;
        });
    }
    
    public copy(): void {
        this.dialogRef.close({details:this.details});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
