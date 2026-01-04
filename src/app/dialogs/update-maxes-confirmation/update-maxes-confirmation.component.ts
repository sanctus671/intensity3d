import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-update-maxes-confirmation',
  templateUrl: './update-maxes-confirmation.component.html',
  styleUrls: ['./update-maxes-confirmation.component.scss'],
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
export class UpdateMaxesConfirmationComponent {
    
    public dialogRef = inject(MatDialogRef<UpdateMaxesConfirmationComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private dialog = inject(MatDialog);
    
    public updateType: string;
    
    constructor() {
        this.updateType = "upcoming";
    }
 
    public update(): void {
        this.dialogRef.close({updateType: this.updateType});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
