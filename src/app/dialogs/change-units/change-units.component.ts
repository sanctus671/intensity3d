import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';

@Component({
  selector: 'app-change-units',
  templateUrl: './change-units.component.html',
  styleUrls: ['./change-units.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    TranslateModule
  ]
})
export class ChangeUnitsComponent {
    
    public dialogRef = inject(MatDialogRef<ChangeUnitsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    public options: any; 
    
    constructor() {
        this.options = {applytoall:true, applyconvert:true};
    }
    
    public change(): void {
        this.dialogRef.close(this.options);
    } 
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
