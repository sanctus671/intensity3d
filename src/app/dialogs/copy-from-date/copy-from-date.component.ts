import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { DiaryService } from '../../services/diary/diary.service';
import { AccountService } from '../../services/account/account.service';
import moment from 'moment';

@Component({
  selector: 'app-copy-from-date',
  templateUrl: './copy-from-date.component.html',
  styleUrls: ['./copy-from-date.component.scss'],
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
    MatProgressSpinnerModule,
    TranslateModule,
    DecimalPipe
  ]
})
export class CopyFromDateComponent {
    
    public dialogRef = inject(MatDialogRef<CopyFromDateComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private diaryService = inject(DiaryService);
    private accountService = inject(AccountService);
    
    public details: any;
    public workout: Array<any> = [];
    public loading: boolean = false;
    public account: any;
    
    constructor() {
        this.details = {exerciseid:this.data.exerciseid};
        
        if (this.data.date){
            this.details.date = this.data.date;
            this.details.dateRaw = moment(this.data.date).toDate();
            this.details.isPreselected = true;
            
            if (this.data.exercise){
                let exercise = {};
                Object.assign(exercise, this.data.exercise);
                this.workout = [exercise];
            } else {
                this.getWorkout();
            }
        } else {
            this.updateDate({value: new Date()});      
        }
        
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
            this.details.userid = account.id;
        });
    }
    
    public getWorkout(): void {
        this.loading = true;
        this.workout = [];
        this.diaryService.preloadWorkout(this.details.date).then((data) => {
            
            if (this.details.exerciseid){
                this.workout = data.filter((item: any) => {return item.exerciseid === this.details.exerciseid});
            } else {
                this.workout = data;
            }
            
            this.loading = false;
        }).catch(() => {
            this.loading = false;
        });
    }
    
    public updateDate(ev: any): void {
        this.details.dateRaw = ev.value;
        this.details.date = moment(ev.value).format("YYYY-MM-DD");
        
        this.getWorkout();
    }
    
    public formatDate(dateString: string): string {
        return moment(dateString).format("MMMM Do YYYY");
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
    
    public getUnits(sets: any[]): string {
        if (sets.length > 0){
            return sets[0].unit
        }
        return this.account.units;
    }      
    
    public copy(): void {
        this.dialogRef.close({details:this.details});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
