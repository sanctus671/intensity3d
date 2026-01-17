import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';

@Component({
  selector: 'app-fatigue-options',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    TranslateModule
  ],
  templateUrl: './fatigue-options.component.html',
  styleUrls: ['./fatigue-options.component.scss']
})
export class FatigueOptionsComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<FatigueOptionsComponent>);
  private data = inject(MAT_DIALOG_DATA, { optional: true }) || {};
  translate = inject(TranslateService);

  startdate = signal<Date | null>(null);
  enddate = signal<Date | null>(null);
  locale = signal<string>('en');

  ngOnInit() {
    this.startdate.set(this.data.startdate ? new Date(this.data.startdate) : new Date(moment().subtract(90, 'days').format('YYYY-MM-DD')));
    this.enddate.set(this.data.enddate ? new Date(this.data.enddate) : new Date());
    this.locale.set(this.translate.getDefaultLang());
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    this.dialogRef.close({
      startdate: this.startdate() ? moment(this.startdate()).format('YYYY-MM-DD') : moment().subtract(90, 'days').format('YYYY-MM-DD'),
      enddate: this.enddate() ? moment(this.enddate()).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD')
    });
  }
}
