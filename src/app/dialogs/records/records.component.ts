import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import { ViewRecordComponent } from '../view-record/view-record.component';
import moment from 'moment';

@Component({
  selector: 'app-records',
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule
  ]
})
export class RecordsComponent {
    
    public dialogRef = inject(MatDialogRef<RecordsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private dialog = inject(MatDialog);
    private accountService = inject(AccountService);
    private diaryService = inject(DiaryService);

    public exercise: any;
    public account: any; 
    public fullRecords: any;
    public localRecords: any;
    
    constructor() {
        this.exercise = this.data.exercise ? this.data.exercise : {sets:[], goals:{goal:0,progress:0}, records: {}};

        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
        
        this.fullRecords = {amrap:[],backoffs:[], overall:[], amrapIndex:0, backoffsIndex:0, overallIndex:0, loading:true};
        
        if (!this.exercise.recordsPage){
            this.calculateRecords();   
        }
        
        this.getFullRecords();
    }

    public calculateRecords(): void {
        this.localRecords = {
            maxReps: 0,
            maxWeight: 0,
            currentVolume: 0,
            estimatedMax: 0
        };

        if (!this.exercise.records.overall){
            this.exercise.records = {
                overall:{max:0,rep:0},
                amrap: {reps:0},
                backoffs: {best:0}
            }
        }

        if (this.exercise.sets.length > 0 && parseInt(this.exercise.records.overall.rep) !== parseInt(this.exercise.sets[this.exercise.sets.length - 1].reps)){
            this.exercise.records.overall.rep = this.exercise.sets[this.exercise.sets.length - 1].reps;
        }
        
        for (let set of this.exercise.sets){
            if (set.reps > this.localRecords.maxReps){
                this.localRecords.maxReps = set.reps; 
            }
           
            if (parseFloat(set.weight) > this.localRecords.maxWeight && this.exercise.records.overall && parseFloat(this.exercise.records.overall.rep) === parseFloat(set.reps)){
                this.localRecords.maxWeight = set.weight;
            }

            let estimatedMax = this.calculate1RM(set.reps, set.weight);
            if (estimatedMax > this.localRecords.estimatedMax){
                this.localRecords.estimatedMax  = estimatedMax;
            }
            
            this.localRecords.currentVolume = this.localRecords.currentVolume + (set.weight * set.reps);
        }
    }
    
    public calculate1RM(reps: number, weight: number): number {
        let max = 0;
        if (reps < 10){
            max = Math.round((weight/(1.0278-0.0278*reps))*100) / 100;
        } else {
            max = Math.round((weight/0.75)*100) / 100;
        }                        
        return max;        
    } 
    
    public getFullRecords(): void {
        this.fullRecords.loading = true;
        this.diaryService.getRecords(this.exercise.exerciseid).then((data) => {
            
            this.fullRecords.amrap = data["amrap"];
            this.fullRecords.overall = data["overall"];
            this.fullRecords.backoffs = data["backoffs"];
            this.fullRecords.amrapIndex = this.generateRandomIndex(this.fullRecords.amrap.length -1);
            this.fullRecords.overallIndex = this.generateRandomIndex(this.fullRecords.overall.length -1);
            this.fullRecords.backoffsIndex = this.generateRandomIndex(this.fullRecords.backoffs.length -1);

            this.fullRecords.loading = false;
        }).catch((e) => {
            this.fullRecords.loading = false;
        });
    }
    
    private generateRandomIndex(max: number): number {
        let min = 0;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }  
    
    public formatDate(dateString: string): string {
        return moment(dateString).format("dddd, MMMM Do YYYY");
    }
    
    public openViewRecord(record: any, type: string): void {
        const dialogRef = this.dialog.open(ViewRecordComponent, {
            width: '300px',
            data: {
                title: this.getRecordTitle(record, type),
                set: record,
                type: type,
                exercise: this.exercise
            },
            autoFocus: false
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.action === 'navigate') {
                // Close this dialog and let the parent handle navigation
                this.dialogRef.close({ action: 'navigate', date: result.date });
            }
        });
    }
    
    private getRecordTitle(record: any, type: string): string {
        if (type === 'overall') {
            return `${record.rep}RM: ${record.max || record.weight}${this.account.units}`;
        } else if (type === 'backoffs') {
            return `${record.best}${this.account.units} volume for ${record.reps} rep sets`;
        } else if (type === 'amrap') {
            return `${record.reps || record.rep} reps with ${record.weight}${this.account.units}`;
        }
        return '';
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
