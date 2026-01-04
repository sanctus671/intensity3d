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
  selector: 'app-change-distance-units',
  templateUrl: './change-distance-units.component.html',
  styleUrls: ['./change-distance-units.component.scss'],
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
export class ChangeDistanceUnitsComponent {
    
    public dialogRef = inject(MatDialogRef<ChangeDistanceUnitsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    public options: any;
    
    constructor() {
        this.options = {applytoall:true};
    }
    
    public change(): void {
        this.dialogRef.close(this.options);
    } 
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
