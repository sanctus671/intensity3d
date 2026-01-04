import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-display-information',
  templateUrl: './display-information.component.html',
  styleUrls: ['./display-information.component.scss'],
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
export class DisplayInformationComponent {
    
    public dialogRef = inject(MatDialogRef<DisplayInformationComponent>);
    public data = inject(MAT_DIALOG_DATA);
    
    public title: string;
    public content: string;
    public actions: Array<any>;
    
    constructor() {
        this.title = this.data.title ? this.data.title : "Information";
        this.content = this.data.content ? this.data.content : "";
        this.actions = this.data.actions ? this.data.actions : [];
    }

    public dismiss(): void { 
        this.dialogRef.close();
    }
}
