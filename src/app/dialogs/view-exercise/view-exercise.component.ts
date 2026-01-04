import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-view-exercise',
  templateUrl: './view-exercise.component.html',
  styleUrls: ['./view-exercise.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ViewExerciseComponent {
    
    public dialogRef = inject(MatDialogRef<ViewExerciseComponent>);
    public data = inject(MAT_DIALOG_DATA);

    public text: string;
    public workout: any;
    public exercise: any;
    
    constructor() {
        let exercise = this.data.exercise ? this.data.exercise : {};
        this.exercise = exercise;
        this.workout = this.data.workout ? this.data.workout : {};
        
        let message = "";
        
        let reps = exercise.reps ? "Reps: " + exercise.reps + "<br>" : "";
        let sets = exercise.sets ? "Sets: " + exercise.sets + "<br>" : "";
        let weight = exercise.weight && exercise.weight > 0 ? "Weight: " + exercise.weight + "<br>" : "";
        let percentage = exercise.percentage && exercise.percentage > 0 ? "Percentage: " + exercise.percentage + "<br>" : "";
        let setType = exercise.type ? "Set Type: " + this.formatExerciseType(exercise.type) + "<br>" : "";
        let rpe = exercise.rpe && exercise.rpe > 0 ? "RPE: " + exercise.rpe + "<br>" : "";
        let notes = exercise.notes ? "Notes: " + exercise.notes : "";
        
        message = reps + sets + weight + percentage + rpe + setType + notes;
        message = message.replace(/^\s*<br\s*\/?>|<br\s*\/?>\s*$/g,'');        
        
        this.text = message;
    }
  
    public formatExerciseType(setType: string): string {
        const types: {[key: string]: string} = {
            amrap : "AMRAP",
            ss : "Super Set",
            ds : "Drop Set",
            bs : "Backoff Set",
            w : "Warmup",
            c : "Circuit"
        };
        
        return types[setType];
    }   
        
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
