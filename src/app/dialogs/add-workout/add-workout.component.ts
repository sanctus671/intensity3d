import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-add-workout',
  templateUrl: './add-workout.component.html',
  styleUrls: ['./add-workout.component.scss'],
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
  ]
})
export class AddWorkoutComponent {
    
    public dialogRef = inject(MatDialogRef<AddWorkoutComponent>);
    public data = inject(MAT_DIALOG_DATA);
    
    public workout: any;
    public details: any;
    
    constructor() {
        this.workout = this.data.workout ? this.data.workout : {};
        this.details = {date:new Date()};
    }
    
    public add(): void {
        this.dialogRef.close(this.details);
    }  
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
