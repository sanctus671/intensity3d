import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { SelectExerciseComponent } from '../../dialogs/select-exercise/select-exercise.component';
import moment from 'moment';

@Component({
  selector: 'app-goal-resets',
  templateUrl: './goal-resets.component.html',
  styleUrls: ['./goal-resets.component.scss'],
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
export class GoalResetsComponent {
    
    public dialogRef = inject(MatDialogRef<GoalResetsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    public dialog = inject(MatDialog);

    public account: any; 
    public resets: Array<any> = [];
    
    constructor() {
        this.account = {};
        
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });

        this.accountService.getResets().then((data) => {
            this.resets = data;
        });          
    }
    
    public openSelectExercise(reset: any): void {
        let dialogRef = this.dialog.open(SelectExerciseComponent, {
            width: '600px',
            data: {}
        });  
        
        dialogRef.afterClosed().subscribe(exercise => {
            if (exercise){
                reset.exerciseid = exercise.id;
                reset.name = exercise.name;
                this.updateReset(reset);               
            }            
        })        
    }
    
    public createReset(): void {
        let reset = {id:null, exerciseid:"",name:"",resetdate:""};
        this.resets.push(reset);
        
        this.accountService.addReset(this.account.id).then((data: any) => {
            reset.id = data.id;
        });
    }
    
    public deleteReset(index: number, reset: any): void {
        this.resets.splice(index,1);
        
        this.accountService.removeReset(reset, this.account.id).then(() => {
            // Reset deleted
        });
    }
    
    public updateReset(reset: any): void {
        reset.resetdate = moment(reset.resetdate).format("YYYY-MM-DD");
        this.accountService.updateReset(reset, this.account.id).then(() => {
            // Reset updated
        });
    }
       
    public add(): void {
        this.dialogRef.close({});
    } 
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
