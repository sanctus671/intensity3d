import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-set',
  templateUrl: './view-set.component.html',
  styleUrls: ['./view-set.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ViewSetComponent {
    
    public dialogRef = inject(MatDialogRef<ViewSetComponent>);
    public data = inject(MAT_DIALOG_DATA);
    
    public exercise: any;
    public set: any;
    
    constructor() {
        this.exercise = this.data.exercise ? this.data.exercise : {};
        this.set = this.data.set ? this.data.set : {};
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
