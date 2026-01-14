import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { SelectExerciseComponent } from '../../dialogs/select-exercise/select-exercise.component';
import { GoalResetsComponent } from '../../dialogs/goal-resets/goal-resets.component';
import moment from 'moment';

@Component({
  selector: 'app-goal-settings',
  templateUrl: './goal-settings.component.html',
  styleUrls: ['./goal-settings.component.scss'],
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
    MatBadgeModule,
    TranslateModule
  ]
})
export class GoalSettingsComponent {
    
    public dialogRef = inject(MatDialogRef<GoalSettingsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    public dialog = inject(MatDialog);

    public account: any; 
    
    constructor() {
        this.account = {goals:{exercise_targets: []}}
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
            
            if (this.account.goals.custom_date_timeframe){
                this.account.goals.day = moment(this.account.goals.custom_date_timeframe).format("dddd").toLowerCase();
            }            
        });
    }
    
    public updateSettings(): void {
        let formatted = {
            primarygoal:this.account.goals.primary, 
            targetgoal:this.account.goals.target, 
            targetcustomgoal:this.account.goals.custom_target, 
            timeframegoal:this.account.goals.timeframe, 
            timeframecustomgoal:this.account.goals.custom_timeframe, 
            timeframecustomdategoal: this.account.goals.custom_date_timeframe, 
            groupinggoal:this.account.goals.grouping
        };
        
        this.accountService.updateSettings(formatted, this.account.id).then(() => {
            this.accountService.setAccountObservable(this.account);
        });
    }
    
    public setTimeframeDay(): void {
        let date = moment().day(this.account.goals.day).format('YYYY-MM-DD');
        this.account.goals.custom_date_timeframe = date;
        this.updateSettings();
    }
    
    public openSelectExercise(target: any): void {
        let dialogRef = this.dialog.open(SelectExerciseComponent, {
            width: '600px',
            data: {}
        });  
        
        dialogRef.afterClosed().subscribe(exercise => {
            if (exercise){
                target.exerciseid = exercise.id;
                target.name = exercise.name;
                this.updateTarget(target);
            }
        })        
    }
    
    public openGoalResetsModal(): void {
        let dialogRef = this.dialog.open(GoalResetsComponent, {
            width: '400px',
            data: {}
        });     
    }    
    
    public createTarget(): void {
        let target = {id:null, exerciseid:"",name:"",target:""};
        this.account.goals.exercise_targets.push(target);
        
        this.accountService.addTarget(this.account.id).then((data: any) => {
            target.id = data.id;
            this.accountService.setAccountObservable(this.account);
        });
    }
    
    public deleteTarget(index: number, target: any): void {
        this.account.goals.exercise_targets.splice(index,1);
        
        this.accountService.removeTarget(target, this.account.id).then((data: any) => {
            this.accountService.setAccountObservable(this.account);
        });
    }
    
    public updateTarget(target: any): void {
        this.accountService.updateTarget(target, this.account.id).then((data: any) => {
            this.accountService.setAccountObservable(this.account);
        });
    }
           
    public add(): void {
        this.dialogRef.close();
    } 
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
