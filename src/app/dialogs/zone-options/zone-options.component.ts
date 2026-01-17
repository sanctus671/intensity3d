import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChangeExerciseComponent } from '../change-exercise/change-exercise.component';
import moment from 'moment';

interface ZoneOptions {
  exerciseid: number | null;
  exerciseName: string;
  startdate: string | null;
  enddate: string | null;
}

@Component({
  selector: 'app-zone-options',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    TranslateModule
  ],
  templateUrl: './zone-options.component.html',
  styleUrls: ['./zone-options.component.scss']
})
export class ZoneOptionsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ZoneOptionsComponent>);
  private data = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  private dialog = inject(MatDialog);
  translate = inject(TranslateService);

  exerciseid = signal<number | null>(null);
  exerciseName = signal<string>('');
  startdate = signal<Date | null>(null);
  enddate = signal<Date | null>(null);
  locale = signal<string>('en');

  ngOnInit() {
    this.exerciseid.set(this.data.exerciseid || null);
    this.exerciseName.set(this.data.exerciseName || '');
    this.startdate.set(this.data.startdate ? new Date(this.data.startdate) : null);
    this.enddate.set(this.data.enddate ? new Date(this.data.enddate) : null);
    this.locale.set(this.translate.getDefaultLang());
  }

  async openSelectExercise() {
    const dialogRef = this.dialog.open(ChangeExerciseComponent, {
      width: '600px',
      data: {
        recentExercises: [],
        exercisesOnly: true,
        showReset: this.exerciseid() ? true : false
      }
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result) {
        console.log(result);
      if (result.clear) {
        this.exerciseid.set(null);
        this.exerciseName.set('');
      } else {
        this.exerciseid.set(result.exerciseid || result.id);
        this.exerciseName.set(result.name);
      }
    }
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    this.dialogRef.close({
      exerciseid: this.exerciseid(),
      exerciseName: this.exerciseName(),
      startdate: this.startdate() ? moment(this.startdate()).format('YYYY-MM-DD') : null,
      enddate: this.enddate() ? moment(this.enddate()).format('YYYY-MM-DD') : null
    });
  }
}
