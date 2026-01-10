import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import { ViewPremiumComponent } from '../view-premium/view-premium.component';
import { RecordHistoryComponent } from '../record-history/record-history.component';
import moment from 'moment';

interface RecordSet {
  assigneddate: string;
  weight?: number;
  reps?: number;
  rep?: number;
  best?: number;
  [key: string]: any;
}

interface Exercise {
  exerciseid: number;
  name: string;
  [key: string]: any;
}

interface User {
  id?: number;
  premium?: boolean;
  units?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-view-record',
  templateUrl: './view-record.component.html',
  styleUrls: ['./view-record.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ViewRecordComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<ViewRecordComponent>);
  public data = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private accountService = inject(AccountService);
  private diaryService = inject(DiaryService);

  public title = signal<string>('');
  public set = signal<RecordSet>({} as RecordSet);
  public user = signal<User>({});
  public type = signal<string>('');
  public exercise = signal<Exercise>({} as Exercise);

  constructor() {
    // Initialize data from dialog input
    if (this.data.title) {
      this.title.set(this.data.title);
    }
    if (this.data.set) {
      this.set.set(this.data.set);
    }
    if (this.data.type) {
      this.type.set(this.data.type);
    }
    if (this.data.exercise) {
      this.exercise.set(this.data.exercise);
    }

    // Load user account
    this.accountService.getAccountLocal().then((user: any) => {
      if (user && user.id) {
        this.user.set(user);
      }
    });
  }

  ngOnInit(): void {}

  public dismiss(): void {
    this.dialogRef.close();
  }

  public openDate(): void {
    const currentSet = this.set();
    if (currentSet.assigneddate) {
      // Open diary in a new tab
      const url = `/diary/${currentSet.assigneddate}`;
      window.open(url, '_blank');
    }
  }

  public formatDate(date: string): string {
    return moment(date).locale(this.translate.getDefaultLang()).format('dddd, MMMM Do YYYY');
  }

  public openPremium(): void {
    const dialogRef = this.dialog.open(ViewPremiumComponent, {
      width: '600px',
      data: { account: this.user() },
      autoFocus: false,
      panelClass: 'premium-dialog'
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.user.update(u => ({ ...u, premium: true }));
      }
    });
  }

  public openRecordHistory(): void {
    const currentUser = this.user();
    
    if (!currentUser.premium) {
      this.openPremium();
      return;
    }

    const dialogRef = this.dialog.open(RecordHistoryComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: {
        user: currentUser,
        set: this.set(),
        type: this.type(),
        exercise: this.exercise()
      },
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(data => {
      // Handle any data returned from record history dialog
    });
  }
}
