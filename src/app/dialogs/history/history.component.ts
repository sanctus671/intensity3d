import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import moment from 'moment';
import { CopyFromDateComponent } from '../../dialogs/copy-from-date/copy-from-date.component';

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    TranslateModule,
    DecimalPipe
  ]
})
export class HistoryComponent {
    
    public dialogRef = inject(MatDialogRef<HistoryComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    private diaryService = inject(DiaryService);
    public snackBar = inject(MatSnackBar);
    public dialog = inject(MatDialog);

    public exercise: any;
    public account: any; 
    public historyPage: number;
    public selectedDateString: string;
    
    constructor() {
        this.exercise = this.data.exercise ? this.data.exercise : {sets:[], goals:{goal:0,progress:0}, history:[]};
        
        this.exercise.canGetMoreHistory = this.exercise.history && this.exercise.history.length > 1 ? true : false;

        this.historyPage = 1;
        this.selectedDateString = this.data.date ? this.data.date : moment().format("YYYY-MM-DD");

        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
    }
    
    public getAverageReps(sets: any[]): number {
        let average = 0;
        for (let set of sets){
            average = average + parseFloat(set.reps);
        }
        average = average / sets.length;
        return average;
    }
    
    public getAverageWeight(sets: any[]): number {
        let average = 0;
        for (let set of sets){
            average = average + parseFloat(set.weight);
        }
        average = average / sets.length;
        return average;        
    }
    
    public formatDate(dateString: string): string {
        return moment(dateString).format("dddd, MMMM Do YYYY");
    }         
    
    public getUnits(sets: any[]): string {
        if (sets.length > 0){
            return sets[0].unit
        }
        return this.account.units;
    }
    
    public loadMoreHistory(): void {
        this.exercise.historyLoading = true;
        this.historyPage += 1;
        
        this.diaryService.getHistory(this.historyPage, this.selectedDateString, this.exercise.exerciseid).then((data) => {
            
            for (let item of data["history"]){
                this.exercise.history.push(item);
            }
            this.exercise.canGetMoreHistory = data["canloadmore"];
            
            this.exercise.historyLoading = false;
        })
        .catch((e) => {
            this.exercise.historyLoading = false;
        })
    }    
    
    public copyWorkout(date: string, exercise: any): void {
        exercise.name = this.exercise.name;
        let dialogRef = this.dialog.open(CopyFromDateComponent, {
            width: '300px',
            data: {date: date, exerciseid: this.exercise.exerciseid, exercise:exercise}
        });
        dialogRef.afterClosed().subscribe(data => {
            if (data && data.details){
                let copyFromDate = moment(data.details.date).format('YYYY-MM-DD');
                let copy = {
                    userid: data.details.userid,
                    exerciseid: this.exercise.exerciseid,
                    type:"sets",
                    date: this.selectedDateString,
                    assigneddate: copyFromDate
                }   
                
                this.snackBar.open('Copying sets...', '', {
                  duration: 5000
                });  
                
                this.diaryService.copyWorkout(copy).then(() => {
                    this.snackBar.open('Sets copied to ' + moment(this.selectedDateString).format('MMMM Do YYYY') + '!', '', {
                        duration: 5000
                    });  
                    
                    this.diaryService.setSelectedDate(this.selectedDateString);
                }).catch(() => {
                    this.snackBar.open('Failed to copy sets', '', {
                        duration: 5000
                    });                     
                })                      
            }
        })     
    }     
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
