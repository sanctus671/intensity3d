import { Component, inject, ViewEncapsulation, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import { ExerciseChartComponent } from '../../components/exercise-chart/exercise-chart.component';
import { NotesComponent } from '../../dialogs/notes/notes.component';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    ExerciseChartComponent
  ]
})
export class StatsComponent {
    
    public dialogRef = inject(MatDialogRef<StatsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    private diaryService = inject(DiaryService);
    public dialog = inject(MatDialog);

    public exercise: any;
    public account: any; 
    public notesCount = signal(0);
    public videosCount = signal(0);
    
    constructor() {
        this.exercise = this.data.exercise ? this.data.exercise : {sets:[], goals:{goal:0,progress:0}};

        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
        
        this.getNotesStats();
    }
    
    private getNotesStats(): void {
        this.diaryService.getStats({exerciseid: this.exercise.exerciseid, type:"notes"}).then((data: any) => {
            console.log(data);
            if (data) {
      
                this.notesCount.set(data.notes);
                this.videosCount.set(data.videos);
            }
        }).catch(() => {
            // Handle error silently
        });
    }
    
    public openNotes(): void {
        let dialogRef = this.dialog.open(NotesComponent, {
            width: '400px',
            data: {exercise: this.exercise}
        });        
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
