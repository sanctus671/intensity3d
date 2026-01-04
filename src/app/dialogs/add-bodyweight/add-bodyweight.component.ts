import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import moment from 'moment';

@Component({
  selector: 'app-add-bodyweight',
  templateUrl: './add-bodyweight.component.html',
  styleUrls: ['./add-bodyweight.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatDatepickerModule,
    TranslateModule
  ],
  providers: [provideNativeDateAdapter()]
})
export class AddBodyweightComponent {
    
    public dialogRef = inject(MatDialogRef<AddBodyweightComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    public bodyweight: any;
    
    constructor() {
        this.bodyweight = {};
        
        if (this.data.bodyweight){
            Object.assign(this.bodyweight, this.data.bodyweight);
            this.bodyweight.createdRaw = moment(this.bodyweight.created).toDate();
        } else {
           this.bodyweight.isAdd = true; 
           this.bodyweight.createdRaw = new Date();
           this.bodyweight.created = moment().format("YYYY-MM-DD");
        }
    }
    
    public updateDate(ev: any): void {
        this.bodyweight.created = moment(ev.value).format("YYYY-MM-DD");
    }    
    
    public add(): void {
        this.dialogRef.close({bodyweight:this.bodyweight});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
