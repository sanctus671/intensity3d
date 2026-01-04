import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { ViewNoteComponent } from '../../dialogs/view-note/view-note.component';

@Component({
  selector: 'app-notes',
  templateUrl: './notes.component.html',
  styleUrls: ['./notes.component.scss'],
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
export class NotesComponent {
    
    public dialogRef = inject(MatDialogRef<NotesComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    private diaryService = inject(DiaryService);
    public snackBar = inject(MatSnackBar);
    public dialog = inject(MatDialog);

    public exercise: any;
    public account: any; 
    public notesPage: number;
    public notes: any;
    
    constructor() {
        this.exercise = this.data.exercise ? this.data.exercise : {sets:[], goals:{goal:0,progress:0}};

        this.notesPage = 1;
        this.notes = {notes:[],count:0, canloadmore: true};
        
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });

        this.getNotes();
    }
    
    public getNotes(): void {
        this.notes = {notes:[],count:0, notesLoading:true};
        this.diaryService.getNotes(this.notesPage, this.exercise.exerciseid).then((data) => {
            this.notes.notesLoading = false;
            this.notes = data;
        }).catch(() => {
            this.notes.notesLoading = false;
        });         
    }
    
    public loadMoreNotes(): void {
        this.notes.notesLoadingMore = true;
        this.notesPage = this.notesPage + 1;
        
        this.diaryService.getNotes(this.notesPage, this.exercise.exerciseid).then((data) => {
            for (let item of data["notes"]){
                this.notes.notes.push(item);
            }
            this.notes.canloadmore = data["canloadmore"];
            this.notes.notesLoadingMore = false;
        })
        .catch((e) => {
            this.notes.notesLoadingMore = false;
        })        
    }
    
    public formatDate(dateString: string): string {
        return moment(dateString).format("dddd, MMMM Do YYYY");
    }         

    public openNote(set: any): void {
        if (!set.notes){
            return;
        }
        
        let dialogRef = this.dialog.open(ViewNoteComponent, {
            width: '300px',
            data: {set:set}
        });        
    }

    public viewVideo(ev: any): void {
        ev.stopPropagation();
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
