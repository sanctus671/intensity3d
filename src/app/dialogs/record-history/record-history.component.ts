import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import { ChartService } from '../../services/chart/chart.service';
import { ECharts, EChartsOption } from 'echarts';
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
  selector: 'app-record-history',
  templateUrl: './record-history.component.html',
  styleUrls: ['./record-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule,
    NgxEchartsModule
  ]
})
export class RecordHistoryComponent implements OnInit {
  public dialogRef = inject(MatDialogRef<RecordHistoryComponent>);
  public data = inject(MAT_DIALOG_DATA);
  private translate = inject(TranslateService);
  private accountService = inject(AccountService);
  private diaryService = inject(DiaryService);
  private chartService = inject(ChartService);

  public title = signal<string>('');
  public set = signal<RecordSet>({} as RecordSet);
  public user = signal<User>({});
  public loading = signal<boolean>(true);
  public type = signal<string>('');
  public exercise = signal<Exercise>({} as Exercise);
  public records = signal<RecordSet[]>([]);

  public chartOptions = signal<EChartsOption>({});
  public chartInstance: ECharts | undefined;

  constructor() {
    // Initialize data from dialog input
    if (this.data.set) {
      this.set.set(this.data.set);
    }
    if (this.data.type) {
      this.type.set(this.data.type);
    }
    if (this.data.exercise) {
      this.exercise.set(this.data.exercise);
    }
    if (this.data.user) {
      this.user.set(this.data.user);
    } else {
      // Load user account if not provided
      this.accountService.getAccountLocal().then((user: any) => {
        if (user && user.id) {
          this.user.set(user);
        }
      });
    }
  }

  ngOnInit(): void {
    const options = this.chartService.getLineChartOptions();
    options.yAxis = [{
      type: 'value',
      splitLine: {
        show: true,
        lineStyle: {
          color: '#e1e1e099'
        }
      },
      min: 'dataMin',
      axisLabel: {
        formatter: (val: number) => {
          if (val > 999) {
            return `${val / 1000}K`;
          }
          return `${val}`;
        }
      }
    }];

    // Initialize with empty series so chart is fully configured
    options.series = [{
      name: this.getRecordTitle(),
      type: 'line',
      data: [],
      color: '#D44735',
      smooth: true
    }];

    this.chartOptions.set(options);
    this.getRecordHistory();
  }

  public getRecordTitle(): string {
    const currentType = this.type();
    const currentSet = this.set();
    
    if (currentType === 'overall') {
      return currentSet.rep + ' ' + this.translate.instant('rep max');
    } else if (currentType === 'backoffs') {
      return this.translate.instant('Best volume for') + ' ' + currentSet.reps + ' ' + this.translate.instant('rep sets');
    } else if (currentType === 'amrap') {
      return this.translate.instant('Best reps with') + ' ' + currentSet.weight + this.user().units;
    }
    
    return '';
  }

  public getRecordValue(record: RecordSet): string {
    const currentType = this.type();
    const currentUser = this.user();
    
    if (currentType === 'overall') {
      return (record.weight ?? 0) + (currentUser.units ?? '');
    } else if (currentType === 'backoffs') {
      return (record.best ?? 0) + (currentUser.units ?? '');
    } else if (currentType === 'amrap') {
      const repValue = record.rep ?? 0;
      const reps = parseFloat(String(repValue));
      return repValue + ' ' + this.translate.instant(reps === 1 ? 'rep' : 'reps');
    }
    
    return '';
  }

  public getRecordValueRaw(record: RecordSet): number {
    const currentType = this.type();
    
    if (currentType === 'overall') {
      return parseFloat(String(record.weight ?? 0));
    } else if (currentType === 'backoffs') {
      return parseFloat(String(record.best ?? 0));
    } else if (currentType === 'amrap') {
      return parseFloat(String(record.rep ?? 0));
    }
    
    return 0;
  }

  public async getRecordHistory(): Promise<void> {
    try {
      const currentType = this.type();
      const currentSet = this.set();
      const currentExercise = this.exercise();

      console.log(currentType);
      console.log(currentSet);
      console.log(currentExercise);
      
      const options: any = { exerciseid: currentExercise.exerciseid, type: currentType };
      
      if (currentType === 'overall') {
        options.reps = currentSet.rep;
      } else if (currentType === 'backoffs') {
        options.reps = currentSet.reps;
      } else if (currentType === 'amrap') {
        options.weight = currentSet.weight;
      }

      const records: any = await this.diaryService.getRecordHistory(options);

      const sortedRecords = records.sort((a: RecordSet, b: RecordSet) => {
        const aDate = new Date(a.assigneddate);
        const bDate = new Date(b.assigneddate);
        if (aDate > bDate) return -1;
        if (aDate < bDate) return 1;
        return 0;
      });

      this.records.set(sortedRecords);
      this.setLineChart(sortedRecords);
      this.loading.set(false);
    } catch (error) {
      console.error('Error loading record history:', error);
      this.loading.set(false);
    }
  }

  public dismiss(): void {
    this.dialogRef.close();
  }

  public openDate(date: string): void {
    // Open diary in a new tab
    const url = `/diary/${date}`;
    window.open(url, '_blank');
  }

  public formatDate(date: string): string {
    return moment(date).locale(this.translate.getDefaultLang()).format('dddd, MMMM Do YYYY');
  }

  private setLineChart(newData: RecordSet[]): void {
    if (this.chartInstance) {
      const series = [
        {
          name: this.getRecordTitle(),
          type: 'line',
          data: newData.map((dataItem: RecordSet) => ({
            name: dataItem.assigneddate,
            value: [dataItem.assigneddate, this.getRecordValueRaw(dataItem)]
          })),
          animationDelay: (idx: number) => idx * 10,
          color: '#D44735',
          smooth: true
        }
      ];

      this.chartInstance.setOption({
        series: series
      }, { replaceMerge: ['series'] });

      this.chartInstance.dispatchAction({
        type: 'dataZoom',
        start: 0,
        end: 100
      });
    }
  }

  public onChartInit(e: ECharts): void {
    this.chartInstance = e;
    
    // Defer update to avoid calling setOption during main process
    setTimeout(() => {
      const data = this.records();
      if (data.length > 0) {
        this.setLineChart(data);
      }
    });
  }
}
