import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { DiaryService } from '../../services/diary/diary.service';
import { ProgramService } from '../../services/program/program.service';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';
import { ViewPooledWorkoutComponent } from '../../dialogs/view-pooled-workout/view-pooled-workout.component';
import { UpdateMaxesComponent } from '../../dialogs/update-maxes/update-maxes.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import moment from 'moment';

@Component({
  selector: 'app-workout-pool',
  templateUrl: './workout-pool.component.html',
  styleUrls: ['./workout-pool.component.scss'],
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
export class WorkoutPoolComponent {
    
    public dialogRef = inject(MatDialogRef<WorkoutPoolComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private diaryService = inject(DiaryService);
    private programService = inject(ProgramService);
    private dialog = inject(MatDialog);
    public snackBar = inject(MatSnackBar);
    
    public workoutPool: any;
    public programs: Array<any> = [];
    public programNames: any;
    public loading: boolean = false;
    public poolCleared: boolean;
    
    constructor() {
        this.programNames = {};
        this.poolCleared = false;
        
        this.workoutPool = this.groupWorkoutPool(this.data.workoutPool);
        
        this.diaryService.getWorkoutPool().then((data) => {
            this.workoutPool = this.groupWorkoutPool(data);
        });  
    }
    
    public groupWorkoutPool(workouts: any[]): any {
        let groupedWorkouts: any = {};
        this.programs = [];
        for (let workout of workouts){
            if (this.programs.indexOf((workout.program_name + workout.addid)) < 0){
                this.programs.push((workout.program_name + workout.addid));
                this.programNames[(workout.program_name + workout.addid)] = workout.program_name;
                groupedWorkouts[(workout.program_name + workout.addid)] = [];
            }
            groupedWorkouts[(workout.program_name + workout.addid)].push(workout);
        }
        return groupedWorkouts;
    }
    
    public deleteWorkoutPool(addId: number): void {
        let dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '300px',
            data: {title:"Are you sure?", content:"This will remove all workouts in this group from your workout pool."},
            autoFocus: false
        });     
              
        dialogRef.afterClosed().subscribe(data => {
            if (data){
                this.loading = true;
                this.diaryService.removeWorkout(addId.toString(), addId, null).then(() => {
                    
                    this.poolCleared = true;
                    this.diaryService.getWorkoutPool().then((data) => {
                        this.workoutPool = this.groupWorkoutPool(data);
                        if (!data || data.length < 1){
                            this.dialogRef.close(true);
                        }
                        this.loading = false;
                    }).catch(() => {
                        this.loading = false;
                    });                             
                }).catch(() => {
                    this.loading = false;
                })                
            }   
        });
    }
    
    public viewWorkout(workout: any): void {
        let dialogRef = this.dialog.open(ViewPooledWorkoutComponent, {
            width: '300px',
            data: {workout:workout},
            autoFocus: false
        });          
    }    

    public addWorkout(ev: any, workout: any): void {
        ev.stopPropagation();
        this.dialogRef.close({workout:workout});
    } 
    
    public updateMaxes(program: any): void {
        this.programService.getProgram(program.programid).then((data) => {
            let programWorkouts = data;
            
            let exerciseIds: any[] = [];
            let exercises: any[] = [];            
                   
            for (let workout of programWorkouts["workouts"]){
                for (let set of workout["exercises"]){
                    let exerciseId = set.exerciseid;
                    if (exerciseIds.indexOf(exerciseId) < 0){
                        exerciseIds.push(exerciseId);
                        exercises.push({exerciseid: exerciseId, name: set.name});
                    }
                }
            }
        
            let dialogRef = this.dialog.open(UpdateMaxesComponent, {
                width: '400px',
                data: {program:program, exercises:exercises, type:"maxesOnly"}
            });        
        
            dialogRef.afterClosed().subscribe(data => {
                if (data && data.maxes){
                    let snack = this.snackBar.open('Updating maxes...', '', {
                        duration: 5000
                    });     

                    this.poolCleared = true;

                    this.programService.updateExerciseMaxes(data.maxes).then(() => {
                        snack.dismiss();

                        let dialogRef = this.dialog.open(DisplayInformationComponent, {
                            width: '300px',
                            data: {
                            title:"Maxes Updated", 
                            content:"Your maxes have been updated."
                            }
                        }); 
                    });
                }
            })   
        })            
    }    
    
    public dismiss(): void { 
        this.dialogRef.close(this.poolCleared);
    }
}
