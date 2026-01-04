import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ShareComponent } from '../../dialogs/share/share.component';

@Component({
  selector: 'app-view-program-details',
  templateUrl: './view-program-details.component.html',
  styleUrls: ['./view-program-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ViewProgramDetailsComponent {
    
    public dialogRef = inject(MatDialogRef<ViewProgramDetailsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    public dialog = inject(MatDialog);
    
    public program: any;
    
    constructor() {
        this.program = this.data.program ? this.data.program : {workouts: []};
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }  
    
    public share(): void {
        let dialogRef = this.dialog.open(ShareComponent, {
            width: '600px',
            data: {
                title:"Share " + this.program.name, 
                description: "Check out " + this.program.name + " on Intensity: " + "http://programs.intensityapp.com/#/programs/" + this.program.id, 
                link:"http://programs.intensityapp.com/#/programs/" + this.program.id
            }
        });          
    }
}
