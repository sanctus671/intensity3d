import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { ProgramService } from '../../services/program/program.service';
import { DiaryService } from '../../services/diary/diary.service';
import moment from 'moment';
import { EditSetComponent } from '../../dialogs/edit-set/edit-set.component';
import { UpdateMaxesComponent } from '../../dialogs/update-maxes/update-maxes.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';

@Component({
  selector: 'app-manage-program',
  templateUrl: './manage-program.component.html',
  styleUrls: ['./manage-program.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    RouterLink,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    TranslateModule
  ]
})
export class ManageProgramComponent {
    
    public dialogRef = inject(MatDialogRef<ManageProgramComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    private programService = inject(ProgramService);
    private diaryService = inject(DiaryService);
    public dialog = inject(MatDialog);
    public snackBar = inject(MatSnackBar);
    
    public program: any;
    public programWorkouts: Array<any> = [];
    public account: any;
    public loading: boolean = false;
    public diaryRequiresUpdate: boolean = false;
    
    constructor() {
        this.account = {};
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
        
        this.program = {name:"", description:"", public:false, duration:7, workouts:[{day:1, name:"Day 1", added:true, exercises:[]}]};
        
        if (this.data.program){
            this.program = this.data.program;
            if (!this.program.id){
                this.program.id = this.program.programid;
            }
        }                
        
        this.getPrograms();
    }
    
    public getPrograms(): void {
        this.loading = true;
        this.programWorkouts = [];
        this.programService.getProgramWorkouts(this.program.id).then((data) => {
            this.loading = false;
            this.programWorkouts = data;
            if (this.programWorkouts.length < 2){
                this.programWorkouts[0].show = true;
            }
        }).catch(() => {
            this.loading = false;
        })      
    }    
    
    public openSet(sets: any[], set: any, index: number): void {
        let dialogRef = this.dialog.open(EditSetComponent, {
            width: '400px',
            data: {set:set}
        });
        dialogRef.afterClosed().subscribe(data => {
            if (data && data.delete){
                this.diaryService.deleteSet(set.id).then(() => {
                    //this.updateExerciseData(exercise);
                });
                sets.splice(index,1);
                this.diaryRequiresUpdate = true;
            }
            else if (data && data.set){
                Object.assign(set,data.set);
                
                if (data.set.updateAll){
                    data.set.massedit = true;
                    data.set.updateAll = false;
                    delete set.massedit;
                    delete set.updateAll;
                    
                    for (let exerciseSet of sets){
                        exerciseSet.reps = set.reps;
                        exerciseSet.weight = set.weight;
                    }
                }                       

                this.diaryService.updateSet(set.id, data.set).then((data) => {
                    set.is_overall_record = data.is_overall_record;
                    //this.updateExerciseData(exercise);
                });
                
                this.diaryRequiresUpdate = true;
            }
        })         
    }
    
    public removeProgram(ev: any, addid: number, index: number): void {
        ev.stopPropagation();
        ev.preventDefault();
        
        let dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '300px',
            data: {title:"Remove Program", content:"Are you sure you want to remove this program? This will delete all workouts from this added program."}
        });        
        
        dialogRef.afterClosed().subscribe(data => {
            if (data){        
                this.programWorkouts.splice(index,1);
                this.diaryService.removeProgram(addid).then(() => {
                    let snack = this.snackBar.open('Program removed!', '', {
                        duration: 5000
                    });
                    
                    this.dialogRef.close(true);
                })
            }
        });        
    }
    
    public updateMaxes(addid: number, index: number): void {
        let exerciseIds: any[] = [];
        let exercises: any[] = [];
        
        for (let workout of this.programWorkouts[index]["workouts"]){
            for (let set of workout["sets"]){
                let exerciseId = set.exerciseid;
                if (exerciseIds.indexOf(exerciseId) < 0){
                    exerciseIds.push(exerciseId);
                    exercises.push({exerciseid: exerciseId, name: set.name});
                }
            }
        }
        
        let dialogRef = this.dialog.open(UpdateMaxesComponent, {
            width: '400px',
            data: {program:this.program, exercises:exercises}
        });        
        
        dialogRef.afterClosed().subscribe(data => {
            if (data && data.maxes && data.updateType){
                let snack = this.snackBar.open('Updating maxes...', '', {
                    duration: 5000
                });     
                
                this.diaryRequiresUpdate = true;
                
                this.programService.updateExerciseMaxes(data.maxes).then(() => {
                    this.programService.updateProgramMaxes(data.updateType, this.program.id, addid, moment().format('YYYY-MM-DD')).then(() => {
                        this.getPrograms();
                        snack.dismiss();
                        
                        let dialogRef = this.dialog.open(DisplayInformationComponent, {
                            width: '300px',
                            data: {
                            title:"Maxes Updated", 
                            content:"Your maxes have been adjusted for this program."
                            }
                        }); 
                    });
                });
            }
        })               
    }
    
    public formatDate(date: string): string {
        return moment(date).format("MMMM Do YYYY");
    }
    
    public viewProgram(): void {
        // View program logic
    }    
    
    public dismiss(): void { 
        this.dialogRef.close(this.diaryRequiresUpdate);
    }
}
