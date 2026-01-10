import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { ExerciseService } from '../../services/exercise/exercise.service';
import { ConfirmationComponent } from '../confirmation/confirmation.component';

@Component({
  selector: 'app-change-exercise',
  templateUrl: './change-exercise.component.html',
  styleUrls: ['./change-exercise.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    TranslateModule
  ]
})
export class ChangeExerciseComponent {
    
    public dialogRef = inject(MatDialogRef<ChangeExerciseComponent>);
    public data = inject(MAT_DIALOG_DATA);
    public exerciseService = inject(ExerciseService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    public recentExercises: Array<any>;   
    public musclegroups: Array<any>;
    public exerciseTypes: Array<any>;
    public properties: any;
    public showReset: boolean = false;
    public exercisesOnly: boolean = false;
    
    constructor() {
        this.properties = {search:"", recentLoading:true};
        console.log(this.data);
        this.showReset = this.data?.showReset || false;
        this.exercisesOnly = this.data?.exercisesOnly || false;
 
        this.recentExercises = [];
        this.musclegroups = ["Rectus Abdominis", "Biceps", "Deltoids", "Erector Spinae", "Gastrocnemius", "Soleus","Gluteus","Hamstrings","Latissimus Dorsi","Rhomboids","Obliques","Pectoralis","Quadriceps","Trapezius","Triceps","Forearms"];
        this.exerciseTypes = ["Squat", "Press", "Deadlift", "Pull", "Isolation"];
      
        this.getRecentExercises();
    }
    
    private getRecentExercises(): void {
        this.exerciseService.getRecentExercisesLocal().then((data) => {
            this.properties.recentLoading = false;
            this.recentExercises = data;
        });
     
        this.exerciseService.getRecentExercises(99).then((data) => {
            this.properties.recentLoading = false;
            this.recentExercises = data;
        });        
    }

    public selectExercise(exercise: any): void {
        if (exercise.exerciseid){exercise.id = exercise.exerciseid} //for recent exercises
        this.dialogRef.close(exercise);
    }
    
    public selectExerciseType(type: string): void {
        this.dialogRef.close({selectedType:type});
    }
    
    public selectMusclegroup(musclegroup: string): void {
        this.dialogRef.close({selectedMusclegroup:musclegroup});
    }
        
    public dismiss(): void { 
        this.dialogRef.close();
    }
    
    public clearSelection(): void {
        this.dialogRef.close({ clear: true });
    }
}
