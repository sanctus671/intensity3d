import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

@Component({
  selector: 'app-view-note',
  templateUrl: './view-note.component.html',
  styleUrls: ['./view-note.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ViewNoteComponent {
    
    public dialogRef = inject(MatDialogRef<ViewNoteComponent>);
    public data = inject(MAT_DIALOG_DATA);

    public set: any;
    
    constructor() {
        this.set = this.data.set ? this.data.set : "";
    }
    
    public formatDate(dateString: string): string {
        return moment(dateString).format("dddd, MMMM Do YYYY");
    }     
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
