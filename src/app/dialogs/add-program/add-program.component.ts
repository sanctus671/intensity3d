import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramService } from '../../services/program/program.service';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import moment from 'moment';

@Component({
  selector: 'app-add-program',
  templateUrl: './add-program.component.html',
  styleUrls: ['./add-program.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatTooltipModule,
    TranslateModule,
    DecimalPipe
  ],
  providers: [provideNativeDateAdapter()]
})
export class AddProgramComponent {
    
    public dialogRef = inject(MatDialogRef<AddProgramComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private programService = inject(ProgramService);
    private accountService = inject(AccountService);
    private diaryService = inject(DiaryService);
    
    public program: any;
    public startDate: Date;
    public details: any;
    public account: any;
    public calculator: any;
    public options: any;
    public exercises: Array<any>;
    public maxCount: number = 0;
    public maxes: any;
    
    public showCalculator: boolean = false;
    public showMoreProgEx: boolean = false;
    
    constructor() {
        this.program = this.data.program ? this.data.program : {};

        this.startDate = new Date();
        this.calculator = {reps:"", weight:""}
        this.options = {
            progressiontype:"", 
            progressionamount: "", 
            progressiontimeframe: "", 
            progressioncycles: 0, 
            progressionexercises:{}, 
            frequencySelect:"", 
            autocomplete:"", 
            rounding:"", 
            roundingcustom:"", 
            pool:"0"
        };
        this.exercises = [];

        this.account = {};
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
            this.options.autocomplete = this.account.autocomplete ? "1" : "0";
        });          
        
        if (!this.program.workouts){
            this.programService.getProgram(this.program.id).then((response) => {
                // The API returns an array with a single program object
                this.program = Array.isArray(response) ? response[0] : response;
                this.getMaxes();
            })
        } else {
            this.getMaxes();      
        }
    }
    
    private getMaxes(): void {
        this.maxes = {};
        this.exercises = [];
        this.maxCount = 0;
        
        for (let workout of this.program.workouts){
            for (let exercise of workout.exercises){
                if (!this.maxes[exercise.exerciseid]){
                    this.maxes[exercise.exerciseid] = exercise
                    this.maxes[exercise.exerciseid]["max"] = "";
                    
                    // Only add exercises that have a percentage to the exercises array
                    if (exercise.percentage && exercise.percentage !== "0"){
                        this.exercises.push(exercise.exerciseid);
                    }
                }
                if (!this.options.progressionexercises[exercise.exerciseid]){
                    this.options.progressionexercises[exercise.exerciseid] = "";
                }
            }
        }
        
        // Only fetch maxes if there are exercises with percentages
        if (this.exercises.length > 0) {
            this.programService.getMaxes(this.exercises).then((data: Array<any>) => {
                for (let exercise of data){
                    if (exercise["onerm"] && exercise["onerm"] > 0){
                        this.maxes[exercise.exerciseid]["max"] = exercise["onerm"];
                        this.maxCount = this.maxCount + 1;
                    }
                }
            })
        }
    }
    
    public calculateMaxes(): void {
        this.maxCount = 0;
        for (var index in this.maxes){
            let exercise = this.maxes[index];
            if (exercise["max"] && exercise["max"] > 0){
                this.maxCount = this.maxCount + 1;
            }            
        }
    }    
    
    public formatDate(date: Date): string {
        return moment(date).format('MMMM Do YYYY');
    }
    
    public getEndDate(): string {
        return moment(this.startDate).add(this.program.duration, "days").format('MMMM Do YYYY');
    }
    
    public getMax(): number {
        let max = 0;
        if (this.calculator.reps < 10){
            max = Math.round((this.calculator.weight/(1.0278-0.0278*this.calculator.reps))*100) / 100;
        } else {
            max = Math.round((this.calculator.weight/0.75)*100) / 100;
        }                       
        return max;         
    }    
    
    public updateFrequency(): void {
        if (this.options.frequencySelect === "every"){
            this.options.progressiontimeframe = 1;
        }
        else if (this.options.frequencySelect === "everyother"){
            this.options.progressiontimeframe = 2;
        }
    }    
    
    public add(): void {
        let options: any = {};
        Object.assign(options, this.options);
        
        options.programid = this.program.id;
        options.assigneddate = moment(this.startDate).format('YYYY-MM-DD');
        options.progressioncycles = this.options.progressioncycles ? (parseInt(this.options.progressioncycles) + 1) : "";

        for (var index in options){
            if (!options[index]){
                options[index] = null;
            }
        }        
        
        this.dialogRef.close({options: options, maxes: this.maxes});
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
