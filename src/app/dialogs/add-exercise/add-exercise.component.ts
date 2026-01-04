import { Component, OnInit, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
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
import { ExerciseSearchPipe } from '../../pipes/exercise-search.pipe';

@Component({
  selector: 'app-add-exercise',
  templateUrl: './add-exercise.component.html',
  styleUrls: ['./add-exercise.component.scss'],
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
    TranslateModule,
    SlicePipe,
    ExerciseSearchPipe
  ]
})
export class AddExerciseComponent {
    
    public dialogRef = inject(MatDialogRef<AddExerciseComponent>);
    public data = inject(MAT_DIALOG_DATA);
    public exerciseService = inject(ExerciseService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    public recommendedExercises:Array<any>;
    public exercises:Array<any>;
    public recentExercises:Array<any>;   
    
    public selectedExercisesRecommended:Array<string>;
    public selectedExercisesRecent:Array<string>;
    public selectedExercisesAll:Array<string>;
    public selectedExercisesOrdered:Array<string>;
    
    public properties: any;
    
    constructor() {
        this.properties = {search:"", exerciseLimit:50, recentLoading:true, exerciseLoading:true, selectedTab:0};
        
        this.selectedExercisesRecommended = [];
        this.selectedExercisesRecent = [];
        this.selectedExercisesAll = [];
        
        this.selectedExercisesOrdered = [];
        
        this.recommendedExercises = this.exerciseService.getRecommendedExercises(); 
        this.recentExercises = [];
        this.exercises = [];
      
        this.getRecentExercises();
        this.getExercises();
    }
    
    public onSelectionChanged(exerciseId: any, selectedExercises: Array<string>): void {
        if (selectedExercises.indexOf(exerciseId) > -1){
            //it is an add
            this.selectedExercisesOrdered.push(exerciseId);
        }
        else{
            //item removed
            let exerciseIndex = this.selectedExercisesOrdered.indexOf(exerciseId);
            this.selectedExercisesOrdered.splice(exerciseIndex,1);                  
        }

        this.refreshSelection();
    }
    
    public clearSearch(): void {
        this.properties.search='';
        this.refreshSelection();
    }
    
    public refreshSelection(): void {
        this.selectedExercisesRecommended = this.selectedExercisesOrdered.slice();
        this.selectedExercisesRecent = this.selectedExercisesOrdered.slice();
        this.selectedExercisesAll = this.selectedExercisesOrdered.slice();        
    }
    
    private getRecentExercises(): void {
        this.exerciseService.getRecentExercisesLocal().then((data) => {
            console.log(data);
            this.properties.recentLoading = false;
            this.recentExercises = data;
            
            if (this.recentExercises.length > 0 && this.properties.selectedTab === 0 && this.selectedExercisesRecommended.length < 1){
                this.properties.selectedTab = 1;
            }
        });
        
        this.exerciseService.getRecentExercises(99).then((data) => {
            this.properties.recentLoading = false;
            this.recentExercises = data;
            
            if (this.recentExercises.length > 0 && this.properties.selectedTab === 0 && this.selectedExercisesRecommended.length < 1){
                this.properties.selectedTab = 1;
            }
        });        
    }
    
    private getExercises(): void {
        this.exerciseService.getExercisesLocal().then((data) => {
            this.properties.exerciseLoading = false;
            this.exercises = data;            
        })
        
        this.exerciseService.getExercises().then((data) => {
            this.properties.exerciseLoading = false;
            this.exercises = data;
        });          
    }
    
    public loadMoreExercises(): void {
        this.properties.exerciseLimit += 50;
    }
    
    public canLoadMoreExercises(): boolean {
        if (this.properties.search){
            let returnItems = this.exercises.filter(item => item.name.toLowerCase().indexOf(this.properties.search.toLowerCase()) !== -1);
            if (returnItems.length > this.properties.exerciseLimit){
                return true
            }
        }       
        else if (this.exercises.length > this.properties.exerciseLimit){
            return true
        }
        
        return false;
    }
    
    public createExercise(exerciseName: string): void {
        let dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '300px',
            data: {
                title:"Create " + exerciseName + "?", 
                content:"You are about to create a new exercise called: " + exerciseName + "."
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            this.snackBar.open('Creating exercise...', '', {
              duration: 5000
            });             
                        
            if (result && result.confirm){
                this.exerciseService.createExercise(exerciseName).then((exercise) => {
                    this.snackBar.open('Exercise created!', '', {
                      duration: 5000
                    });   
                    this.getExercises();
                    this.exercises.push(exercise)                   
                }).catch((e) => {
                    this.snackBar.open('This exercise already exists in the exercise database', '', {
                      duration: 5000
                    });                      
                });
            }
        });          
    }
    
    public add(): void {
        let returnExercises = [];
        for (let selectedExercise of this.selectedExercisesOrdered){
            for (let exercise of this.exercises){
                if (selectedExercise === exercise.id){
                    returnExercises.push({name:exercise.name, exerciseid:exercise.id, calibrating:false,addid:null,goals:{goal:1,progress:0},history:[],records:{},sets:[], reps:"",weight:"", unit:false});
                }
            }
        }
        this.dialogRef.close({exercises:returnExercises});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }            
    
    public numberWithCommas(x: number): string {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }      
                
                
    ngOnInit(){}    
        

}
