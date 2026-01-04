import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ConfirmationComponent {
    
    public dialogRef = inject(MatDialogRef<ConfirmationComponent>);
    public data = inject(MAT_DIALOG_DATA);
    
    public title: string;
    public content: string;
    
    constructor() {
        this.title = this.data.title ? this.data.title : "Confirm";
        this.content = this.data.content ? this.data.content : "Are you sure?";
    }
 
    public confirm(): void {
        this.dialogRef.close({confirm:true});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
