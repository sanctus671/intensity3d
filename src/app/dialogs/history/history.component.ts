import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
    TranslateModule
  ]
})
export class HistoryComponent {
    
    public dialogRef = inject(MatDialogRef<HistoryComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    private diaryService = inject(DiaryService);
    public snackBar = inject(MatSnackBar);
    public dialog = inject(MatDialog);
    private translate = inject(TranslateService);

    public exercise: any;
    public account: any; 
    public historyPage: number;
    public selectedDateString: string;
    
    constructor() {
        this.exercise = this.data.exercise ? this.data.exercise : {sets:[], goals:{goal:0,progress:0}, history:[], loadingFullData: false};
        
        // Ensure loadingFullData is set if not already
        if (this.exercise.loadingFullData === undefined) {
            this.exercise.loadingFullData = false;
        }
        
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
        if (this.exercise.historyLoading) {
            return; // Avoid making multiple concurrent requests
        }
        
        this.exercise.historyLoading = true;
        this.historyPage += 1;
        
        this.diaryService.getHistory(this.historyPage, this.selectedDateString, this.exercise.exerciseid).then((data) => {
            if (!data["history"]) {
                this.exercise.historyLoading = false;
                return; // No more data to load
            }
            
            const newHistory = data["history"];
            const combinedHistory = [...this.exercise.history, ...newHistory];
            
            // Merge workouts with the same date in the combined history
            const historyMap: { [key: string]: any } = {};
            
            for (const workout of combinedHistory) {
                if (historyMap[workout.assigneddate]) {
                    // Date exists, so merge these sets
                    historyMap[workout.assigneddate].sets = historyMap[workout.assigneddate].sets.concat(workout.sets);
                    historyMap[workout.assigneddate].sets.sort((a: any, b: any) => parseInt(a.sets) - parseInt(b.sets));
                } else {
                    historyMap[workout.assigneddate] = workout;
                    historyMap[workout.assigneddate].sets.sort((a: any, b: any) => parseInt(a.sets) - parseInt(b.sets));
                }
            }
            
            // Convert back to array
            this.exercise.history = Object.values(historyMap);
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
    
    public viewDiary(workout: any): void {
        this.dialogRef.close({ action: 'viewDiary', date: workout.assigneddate });
    }
    
    public shareWorkout(workout: any): void {
        const title = `Intensity Workout - ${moment(workout.assigneddate).locale(this.translate.currentLang || 'en').format('dddd, MMMM Do YYYY')}`;
        
        // Open share dialog
        import('../share/share.component').then(m => {
            this.dialog.open(m.ShareComponent, {
                width: '500px',
                data: {
                    title: title,
                    link: 'https://www.intensityapp.com',
                    shareType: 'workout',
                    showShareTypeSelector: false,
                    exercise: {
                        name: this.exercise.name,
                        sets: workout.sets
                    },
                    workout: []
                }
            });
        });
    }
    
    public toggleSet(event: Event, set: any): void {
        event.preventDefault();
        event.stopPropagation();
        
        set.completed = !set.completed || set.completed === '0' ? '1' : '0';
        
        this.diaryService.updateSet(set.id, { completed: set.completed }).then(() => {
            this.diaryService.setSelectedDate(this.selectedDateString);
        }).catch(() => {
            // Revert on error
            set.completed = set.completed === '1' ? '0' : '1';
            this.snackBar.open('Failed to update set', '', {
                duration: 3000
            });
        });
    }
    
    public openEditSet(event: Event, set: any, workout: any, index: number): void {
        event.preventDefault();
        event.stopPropagation();
        
        // Import and open edit set dialog
        import('../edit-set/edit-set.component').then(m => {
            const dialogRef = this.dialog.open(m.EditSetComponent, {
                width: '400px',
                data: { 
                    set: { ...set }, 
                    exercise: { 
                        ...this.exercise,
                        name: this.exercise.name,
                        exerciseid: this.exercise.exerciseid
                    }
                }
            });
            
            dialogRef.afterClosed().subscribe(result => {
                if (result && result.delete) {
                    this.diaryService.deleteSet(set.id).then(() => {
                        workout.sets.splice(index, 1);
                        this.diaryService.setSelectedDate(this.selectedDateString);
                    }).catch(() => {
                        this.snackBar.open('Failed to delete set', '', {
                            duration: 3000
                        });
                    });
                } else if (result && result.set) {
                    const updatedSet = result.set;
                    Object.assign(set, updatedSet);
                    
                    if (updatedSet.updateAll) {
                        updatedSet.massedit = true;
                        updatedSet.updateAll = false;
                        delete set.massedit;
                        delete set.updateAll;
                        
                        for (let exerciseSet of workout.sets) {
                            exerciseSet.reps = set.reps;
                            exerciseSet.weight = set.weight;
                        }
                    }
                    
                    this.diaryService.updateSet(set.id, updatedSet).then((data) => {
                        set.is_overall_record = data.is_overall_record;
                        this.diaryService.setSelectedDate(this.selectedDateString);
                    }).catch(() => {
                        this.snackBar.open('Failed to update set', '', {
                            duration: 3000
                        });
                    });
                }
            });
        });
    }
}
