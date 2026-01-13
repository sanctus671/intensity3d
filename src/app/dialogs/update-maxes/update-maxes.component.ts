import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramService } from '../../services/program/program.service';
import { AccountService } from '../../services/account/account.service';
import { UpdateMaxesConfirmationComponent } from '../../dialogs/update-maxes-confirmation/update-maxes-confirmation.component';

@Component({
  selector: 'app-update-maxes',
  templateUrl: './update-maxes.component.html',
  styleUrls: ['./update-maxes.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    DecimalPipe
  ]
})
export class UpdateMaxesComponent {
    
    public dialogRef = inject(MatDialogRef<UpdateMaxesComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private programService = inject(ProgramService);
    private accountService = inject(AccountService);
    private dialog = inject(MatDialog);
    
    public program: any;
    public account: any;
    public calculator: any;
    public exercises: Array<any> = [];
    public programExercises: Array<any>;
    public maxCount: number = 0;
    public maxes: any;
    public loading: boolean;
    public showCalculator: boolean = false;
    
    constructor() {
        this.loading = true;
        this.program = this.data.program ? this.data.program : {};
        this.programExercises = this.data.exercises ? this.data.exercises : [];

        this.calculator = {reps:"", weight:""}
        
        this.account = {};
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });          
        
        this.getMaxes();
    }
    
    private getMaxes(): void {
        this.maxes = {};
        this.exercises = [];
        this.maxCount = 0;
        
        for (let exercise of this.programExercises){
            if (!this.maxes[exercise.exerciseid]){
                this.maxes[exercise.exerciseid] = exercise
                this.maxes[exercise.exerciseid]["max"] = "";
                this.exercises.push(exercise.exerciseid);
            }
        }
        
        this.programService.getMaxes(this.exercises).then((data: Array<any>) => {
            console.log(data);
            for (let exercise of data){
                if (exercise["onerm"] && exercise["onerm"] > 0){
                    this.maxes[exercise.exerciseid]["max"] = exercise["onerm"];
                    this.maxCount = this.maxCount + 1;
                }
            }
            
            this.loading = false;
        })
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
    
    public getMax(): number {
        let max = 0;
        let reps = this.calculator.reps;
        let weight = this.calculator.weight;
        
        if (reps < 10){
            max = Math.round((weight/(1.0278-0.0278*reps))*100) / 100;
        } else {
            max = Math.round((weight/0.75)*100) / 100;
        }                        
        return max;        
    }
    
    public update(): void {
        if (this.data.type === "maxesOnly"){
            this.dialogRef.close({maxes:this.maxes});
            return;
        }
        
        let dialogRef = this.dialog.open(UpdateMaxesConfirmationComponent, {
            width: '300px',
            data: {}
        });        
        
        dialogRef.afterClosed().subscribe(data => {
            if (data && data.updateType){
                this.dialogRef.close({maxes:this.maxes, updateType:data.updateType});
            }
        })        
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
