import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramService } from '../../services/program/program.service';

@Component({
  selector: 'app-view-pooled-workout',
  templateUrl: './view-pooled-workout.component.html',
  styleUrls: ['./view-pooled-workout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    TranslateModule
  ]
})
export class ViewPooledWorkoutComponent {
    
    public dialogRef = inject(MatDialogRef<ViewPooledWorkoutComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private programService = inject(ProgramService);
    
    public workout: any;
    public loading: boolean = false;
    
    constructor() {
        let workout = this.data.workout ? this.data.workout : {};
        
        this.loading = true;
        this.workout = {name:workout.workout_name, exercises: []};
        
        this.getWorkout(workout.workoutid);
    }
    
    public getWorkout(workoutId: number): void {
        this.loading = true;
        this.programService.getWorkout(workoutId).then((data: Array<any>) => {
            this.loading = false;
            if (data && data.length > 0){
                this.workout = data[0];
            }
        }).catch(() => {
            this.loading = false;
        })      
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
