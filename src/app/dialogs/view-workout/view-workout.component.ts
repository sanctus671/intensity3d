import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-workout',
  templateUrl: './view-workout.component.html',
  styleUrls: ['./view-workout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ViewWorkoutComponent {
    
    public dialogRef = inject(MatDialogRef<ViewWorkoutComponent>);
    public data = inject(MAT_DIALOG_DATA);
    
    public workout: any;
    
    constructor() {
        this.workout = this.data.workout ? this.data.workout : {exercises: []};
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
