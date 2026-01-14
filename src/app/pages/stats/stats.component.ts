import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EChartsOption, ECharts } from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import moment from 'moment';

import { AccountService } from '../../services/account/account.service';
import { ChartService } from '../../services/chart/chart.service';
import { DiaryService } from '../../services/diary/diary.service';
import { ExerciseService } from '../../services/exercise/exercise.service';

import { RecordsComponent } from '../../dialogs/records/records.component';
import { NotesComponent } from '../../dialogs/notes/notes.component';
import { ChangeExerciseComponent } from '../../dialogs/change-exercise/change-exercise.component';
import { MostTrackedComponent } from '../../dialogs/most-tracked/most-tracked.component';
import { ExerciseBreakdownComponent } from '../../dialogs/exercise-breakdown/exercise-breakdown.component';
import { ViewPremiumComponent } from '../../dialogs/view-premium/view-premium.component';
import { ZoneOptionsComponent } from '../../dialogs/zone-options/zone-options.component';
import { FatigueOptionsComponent } from '../../dialogs/fatigue-options/fatigue-options.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import { ExerciseChartComponent } from '../../components/exercise-chart/exercise-chart.component';

@Component({
  selector: 'app-stats',
  imports: [
    CommonModule,
    FormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule,
    NgxEchartsModule,
    ExerciseChartComponent
  ],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.scss']
})
export class StatsComponent implements OnInit {
  private accountService = inject(AccountService);
  private diaryService = inject(DiaryService);
  private exerciseService = inject(ExerciseService);
  private chartService = inject(ChartService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  translate = inject(TranslateService);

  // Signals
  user = signal<any>({});
  selectedTab = signal<number>(0);
  loading = signal<number>(0);
  searchQuery = signal<string>('');
  recordsLoading = signal<boolean>(false);

  // Chart signals
  heatmapChartOptions = signal<EChartsOption>({});
  heatmapChartInstance = signal<ECharts | undefined>(undefined);
  heatmapMonths = signal<number>(12);

  zonesChartOptions = signal<EChartsOption>({});
  zonesChartInstance = signal<ECharts | undefined>(undefined);

  fatigueCombinedChartOptions = signal<EChartsOption>({});
  fatigueCombinedChartInstance = signal<ECharts | undefined>(undefined);

  barChartOptions = signal<EChartsOption>({});
  barChartInstance = signal<ECharts | undefined>(undefined);

  pieChartOptions = signal<EChartsOption>({});
  pieChartInstance = signal<ECharts | undefined>(undefined);

  // Data signals
  notesStats = signal<any>({ notes: 0, videos: 0 });
  highlights = signal<any>({});
  generalStats = signal<any>({});
  selectedExercise = signal<any>({});
  recentExercises = signal<any[]>([]);

  zoneOptions = signal<any>({
    type: 'percentage',
    exerciseid: null,
    exerciseName: '',
    startdate: moment().subtract(1, 'years').format('YYYY-MM-DD'),
    enddate: moment().format('YYYY-MM-DD')
  });

  fatigueData = signal<any>({
    workoutContributions: [],
    cumulativeTrend: [],
    currentStatus: null
  });

  fatigueOptions = signal<any>({
    startdate: moment().subtract(90, 'days').format('YYYY-MM-DD'),
    enddate: moment().format('YYYY-MM-DD')
  });

  // Computed signals
  filteredExercises = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.recentExercises();
    return this.recentExercises().filter((exercise: any) => 
      exercise.name.toLowerCase().includes(query)
    );
  });

  constructor() {
    // Subscribe to account changes
    this.accountService.getAccountObservable().subscribe((user: any) => {
      if (user && user.id) {
        const upgraded = this.user().id && user.premium !== this.user().premium;
        this.user.set(user);

        if (upgraded) {
          this.getIntensityZones();
        }
      }
    });
  }

  ngOnInit() {
    const today = moment();
    const endDate = today.format('YYYY-MM-DD');
    const startDate = today.subtract(1, 'year').format('YYYY-MM-DD');

    this.heatmapChartOptions.set(this.chartService.getHeatmapChartOptions(startDate, endDate));
    this.barChartOptions.set(this.chartService.getBarChartOptions());
    this.zonesChartOptions.set(this.chartService.getZoneBarChartOptions());
    this.pieChartOptions.set(this.chartService.getPieChartOptions());
    this.fatigueCombinedChartOptions.set(this.chartService.getFatigueCombinedChartOptions());

    this.loadGeneralStats();
  }

  onTabChange(index: number) {
    this.selectedTab.set(index);
    if (index === 1) {
      this.loadRecentExercises();
    }
  }

  async loadGeneralStats() {
    try {
      const data: any = await this.diaryService.getStats({ type: 'generaluserdata' });

      this.notesStats.set({
        notes: data.notes,
        videos: data.videos
      });

      this.generalStats.set(data);

      this.highlights.set({
        best_streak: data.best_streak,
        current_streak: data.current_streak,
        last_tracked: data.heatmap.length > 0 ? data.heatmap[0] : null,
        last_year: data.heatmap.length
      });

      this.setHeatmapChartData();
      this.setBarChartData();
      this.setPieChartData();

      // Increment loading to trigger exercise chart load
      // Premium features will load after chart completes via onExerciseChartLoadComplete
      this.loading.update(v => v + 1);
    } catch (error) {
      console.error('Error loading general stats:', error);
      this.loading.update(v => v + 1);
    }
  }

  async onExerciseChartLoadComplete() {
    // Load premium features after exercise chart has finished loading
    if (this.user().premium) {
      await this.getIntensityZones();
      await this.getFatigueData();
    }
  }

  onExerciseChanged() {
    // Trigger chart reload when exercise selection changes
    this.loading.update(v => v + 1);
  }

  async loadRecentExercises() {
    this.recordsLoading.set(true);

    // Load cached data first
    const cachedData = await this.exerciseService.getRecentExercisesLocal();
    if (cachedData && cachedData.length > 0) {
      this.recentExercises.set(cachedData);
      this.recordsLoading.set(false);
    }

    // Then load fresh data
    try {
      const data: any = await this.exerciseService.getRecentExercises();
      this.recentExercises.set(data);
    } catch (error) {
      console.error('Error loading recent exercises:', error);
    } finally {
      this.recordsLoading.set(false);
    }
  }

  async selectExercise(exercise: any) {
    const dialogRef = this.dialog.open(RecordsComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { exercise, user: this.user() }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result && result.selectedDate) {
      this.router.navigate(['/diary'], { queryParams: { selectedDate: result.selectedDate } });
    }
  }

  async openSelectExercise() {
    const currentExercise = this.selectedExercise();
    const dialogRef = this.dialog.open(ChangeExerciseComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        showReset: currentExercise && Object.keys(currentExercise).length > 0
      }
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result) {
      console.log(result);
      if (result.clear) {
        this.selectedExercise.set({});
      } else if (result.selectedMusclegroup) {
        this.selectedExercise.set({
          name: result.selectedMusclegroup,
          isMuscleGroup: true
        });
      } else if (result.selectedType) {
        this.selectedExercise.set({
          name: result.selectedType,
          isExerciseType: true
        });
      } else {
        this.selectedExercise.set(result);
      }
      // Trigger chart reload after exercise selection changes
      this.onExerciseChanged();
    }
  }

  async openNotes() {
    const dialogRef = this.dialog.open(NotesComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: { exerciseid: null, user: this.user() }
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result && result.selectedDate) {
      setTimeout(() => {
        this.router.navigate(['/diary'], { queryParams: { selectedDate: result.selectedDate } });
      }, 500);
    }
  }

  openDetails(title: string, subTitle: string | null, message: string) {
    let content = '';
    if (subTitle) {
      content += `<p><strong>${subTitle}</strong></p>`;
    }
    if (message) {
      content += `<p>${message}</p>`;
    }
    
    this.dialog.open(DisplayInformationComponent, {
      width: '300px',
      maxWidth: '95vw',
      data: {
        title: title,
        content: content
      }
    });
  }

  async openPremium() {
    const dialogRef = this.dialog.open(ViewPremiumComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { account: this.user() }
    });
    
    
    dialogRef.afterClosed().subscribe(data => {
        if (data){
            this.user.set({...this.user, premium:true});
        }
    }) 
  }

  async openMostTracked() {
    if (!this.user().premium) {
      this.openPremium();
      return;
    }

    const dialogRef = this.dialog.open(MostTrackedComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { user: this.user() }
    });
    await dialogRef.afterClosed().toPromise();
  }

  async openExerciseBreakdown() {
    if (!this.user().premium) {
      this.openPremium();
      return;
    }

    const dialogRef = this.dialog.open(ExerciseBreakdownComponent, {
      width: '700px',
      maxWidth: '95vw',
      data: { user: this.user() }
    });
    await dialogRef.afterClosed().toPromise();
  }

  async openZoneOptions() {
    const dialogRef = this.dialog.open(ZoneOptionsComponent, {
      width: '300px',
      maxWidth: '95vw',
      data: this.zoneOptions()
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.zoneOptions.set({
        ...this.zoneOptions(),
        exerciseid: result.exerciseid || null,
        exerciseName: result.exerciseName || '',
        startdate: result.startdate || null,
        enddate: result.enddate || null
      });
      this.getIntensityZones();
    }
  }

  async openFatigueOptions() {
    const dialogRef = this.dialog.open(FatigueOptionsComponent, {
      width: '300px',
      maxWidth: '95vw',
      data: this.fatigueOptions()
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (result) {
      this.fatigueOptions.set({
        startdate: result.startdate || moment().subtract(90, 'days').format('YYYY-MM-DD'),
        enddate: result.enddate || moment().format('YYYY-MM-DD')
      });
      this.getFatigueData();
    }
  }

  openFatigueInfo() {
    if (!this.fatigueData().currentStatus) return;

    const recommendation = this.getFatigueRecommendation();
    const message = `
      <strong>${this.translate.instant('Recommendation')}:</strong><br>
      ${recommendation}

      <p><strong>${this.translate.instant('Cumulative Fatigue')} (${this.translate.instant('Line')}):</strong><br>
      🟢 ${this.translate.instant('Green')}: ${this.translate.instant('Low')} (&lt;80)<br>
      🟠 ${this.translate.instant('Orange')}: ${this.translate.instant('Medium')} (80-150)<br>
      🔴 ${this.translate.instant('Red')}: ${this.translate.instant('High')} (&gt;150)</p>

      <p><strong>${this.translate.instant('Per-Workout Fatigue')} (${this.translate.instant('Bars')}):</strong><br>
      🟢 ${this.translate.instant('Green')}: ${this.translate.instant('Low')} (&lt;20)<br>
      🟠 ${this.translate.instant('Orange')}: ${this.translate.instant('Medium')} (20-40)<br>
      🔴 ${this.translate.instant('Red')}: ${this.translate.instant('High')} (&gt;40)</p>
    `;

    this.dialog.open(DisplayInformationComponent, {
      width: '300px',
      maxWidth: '95vw',
      data: {
        title: this.translate.instant('Fatigue Information'),
        content: message
      }
    });
  }

  private getFatigueRecommendation(): string {
    if (!this.fatigueData().currentStatus) return '';

    const level = this.fatigueData().currentStatus.level;
    const fatigue = this.fatigueData().currentStatus.fatigue;

    if (level === 'low' || fatigue < 80) {
      return this.translate.instant('Your fatigue levels are well-managed. You have good capacity for high-intensity training. Consider maintaining your current training volume or gradually increasing it.');
    } else if (level === 'medium' || (fatigue >= 80 && fatigue <= 150)) {
      return this.translate.instant('Your fatigue is moderate. Monitor your recovery and listen to your body. Consider incorporating more rest days or reducing training intensity if you feel overtrained.');
    } else {
      return this.translate.instant('Your fatigue levels are high. Prioritize recovery with additional rest days, lighter training sessions, and adequate sleep. Consider a deload week to allow proper recovery.');
    }
  }

  async getIntensityZones() {
    try {
      const zoneData = await this.diaryService.getIntensityZones(this.zoneOptions());
      this.setZonesChartData(zoneData);
    } catch (error) {
      console.error('Error loading intensity zones:', error);
    }
  }

  async getFatigueData() {
    try {
      const fatigueResult: any = await this.diaryService.getFatigueData(this.fatigueOptions());
      this.fatigueData.set(fatigueResult);
      this.setFatigueCombinedChartData();
    } catch (error) {
      console.error('Error fetching fatigue data:', error);
    }
  }

  async changeZoneType(type: string) {
    this.zoneOptions.update(opts => ({ ...opts, type }));
    await this.getIntensityZones();
  }

  // Chart methods
  onHeatmapChartInit(e: ECharts) {
    this.heatmapChartInstance.set(e);
  }

  onBarChartInit(e: ECharts) {
    this.barChartInstance.set(e);
  }

  onPieChartInit(e: ECharts) {
    this.pieChartInstance.set(e);
  }

  onZonesChartInit(e: ECharts) {
    this.zonesChartInstance.set(e);
  }

  onFatigueCombinedChartInit(e: ECharts) {
    this.fatigueCombinedChartInstance.set(e);
  }

  private calculateOpacityStep(index: number, totalItems: number): string {
    const minOpacity = 64;
    const maxOpacity = 255;
    const step = (maxOpacity - minOpacity) / (totalItems - 1);
    const currentOpacity = Math.round(minOpacity + step * index);
    return currentOpacity.toString(16).padStart(2, '0');
  }

  private setZonesChartData(zoneData: any) {
    const instance = this.zonesChartInstance();
    if (instance) {
      const categories = Object.keys(zoneData);
      const totalValue = categories.reduce((total, category) => total + zoneData[category], 0);

      const categoryData = categories.map((category, index) => {
        const value = zoneData[category];
        const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
        const opacity = this.calculateOpacityStep(index, categories.length);

        return {
          value: percentage.toFixed(0),
          itemStyle: {
            color: `#d44735${opacity}`
          }
        };
      });

      instance.setOption({
        yAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            width: '80',
            overflow: 'truncate'
          }
        }
      }, { replaceMerge: ['yAxis'] });

      instance.setOption({
        series: {
          name: this.translate.instant('Time in zone'),
          type: 'bar',
          data: categoryData
        }
      }, { replaceMerge: ['series'] });
    }
  }

  private setFatigueCombinedChartData() {
    const instance = this.fatigueCombinedChartInstance();
    const data = this.fatigueData();
    
    if (instance && data.workoutContributions && data.cumulativeTrend) {
      const dates = data.workoutContributions.map((item: any) =>
        moment(item.date).format('MMM D')
      );

      const barData = data.workoutContributions.map((item: any) => ({
        value: item.fatigue,
        itemStyle: {
          color: this.getFatigueColor(item.color)
        }
      }));

      const lineData = data.cumulativeTrend.map((item: any) => item.fatigue);

      instance.setOption({
        xAxis: {
          data: dates
        },
        series: [
          {
            name: this.translate.instant('Per-Workout'),
            type: 'bar',
            data: barData,
            barMaxWidth: 30
          },
          {
            name: this.translate.instant('Cumulative'),
            type: 'line',
            data: lineData,
            smooth: true,
            lineStyle: {
              width: 2
            }
          }
        ]
      });
    }
  }

  private getFatigueColor(color: string): string {
    switch (color) {
      case 'green': return '#22c55e';
      case 'yellow': return '#f97316';
      case 'red': return '#ef4444';
      default: return '#d44735';
    }
  }

  private setBarChartData() {
    const instance = this.barChartInstance();
    const stats = this.generalStats();
    
    if (instance && stats.most_tracked_exercises) {
      const categories = [];
      const categoryData = [];

      for (const exercise of stats.most_tracked_exercises) {
        categories.push(exercise.name);
        categoryData.push(parseInt(exercise.sessions));
      }
      
      categories.reverse();
      categoryData.reverse();
      
      instance.setOption({
        yAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            width: '120',
            overflow: 'truncate'
          }
        }
      }, { replaceMerge: ['yAxis'] });

      instance.setOption({
        series: {
          name: this.translate.instant('Sessions'),
          type: 'bar',
          data: categoryData,
          color: '#d44735'
        }
      }, { replaceMerge: ['series'] });
    }
  }

  private setHeatmapChartData() {
    const instance = this.heatmapChartInstance();
    const stats = this.generalStats();
    
    if (instance && stats.heatmap) {
      const heatmapSeries = [];
      let min = 10000;
      let max = 0;
      let lowestDate: moment.Moment | null = null;
      let highestDate: moment.Moment | null = null;

      for (const heatmapItem of stats.heatmap) {
        const volume = parseInt(heatmapItem.volume);
        const assignedDate = moment(heatmapItem.assigneddate);

        heatmapSeries.push([
          heatmapItem.assigneddate,
          volume,
        ]);

        if (!lowestDate || assignedDate.isBefore(lowestDate)) {
          lowestDate = assignedDate;
        }

        if (!highestDate || assignedDate.isAfter(highestDate)) {
          highestDate = assignedDate;
        }

        if (volume > max) max = volume;
        if (volume < min) min = volume;
      }

      let monthsDifference = 12;
      if (lowestDate && highestDate) {
        monthsDifference = highestDate.diff(lowestDate, 'months');
      }

      this.heatmapMonths.set(monthsDifference);

      instance.setOption({
        series: {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: heatmapSeries
        }
      }, { replaceMerge: ['series'] });

      instance.setOption({
        visualMap: {
          min: Math.floor(min / 1000) * 1000,
          max: Math.ceil(max / 1000) * 1000,
          type: 'piecewise',
          splitNumber: monthsDifference < 6 ? 3 : 5,
          orient: 'horizontal',
          left: 'center',
          bottom: 0,
          textStyle: { color: '#8b8888' },
          inRange: {
            color: ['#F3EED9b3', '#d44735']
          },
          formatter: (value: number, value2: number) => {
            let valueFormatted = '' + value;
            let valueInt = parseInt(valueFormatted);
            if (valueInt > 999) {
              valueFormatted = `${(Math.floor(valueInt / 1000) * 1000) / 1000}K`;
            } else {
              valueFormatted = valueInt + '';
            }
            
            let value2Formatted = '' + value2;
            let value2Int = parseInt(value2Formatted);
            if (value2Int > 999) {
              value2Formatted = `${(Math.floor(value2Int / 1000) * 1000) / 1000}K`;
            } else {
              value2Formatted = value2Int + '';
            }

            return `${valueFormatted} - ${value2Formatted}`;
          }
        }
      }, { replaceMerge: ['visualMap'] });

      if (lowestDate && highestDate) {
        instance.setOption({
          calendar: {
            bottom: 40,
            left: 30,
            right: 30,
            cellSize: ['auto', 13],
            range: [
              lowestDate.format('YYYY-MM-DD'),
              monthsDifference < 6 ? highestDate.endOf('month').format('YYYY-MM-DD') : highestDate.format('YYYY-MM-DD')
            ],
            itemStyle: {
              borderWidth: 0.5,
              borderColor: 'rgba(139,136,136,0)',
              color: 'transparent'
            },
            yearLabel: { show: false },
            splitLine: { lineStyle: { color: '#8b888899', width: 1 } },
            dayLabel: { color: '#8b8888' },
            monthLabel: {
              color: '#8b8888',
              formatter: (params: any) => {
                return moment(params.yyyy + '-' + params.MM + '-01').locale(this.translate.getDefaultLang()).format('MMM');
              }
            }
          }
        }, { replaceMerge: ['calendar'] });
      }
    }
  }

  private setPieChartData() {
    const instance = this.pieChartInstance();
    const stats = this.generalStats();
    
    if (instance && stats.exercise_type && stats.musclegroup) {
      const exerciseTypesData = [];
      for (const index in stats.exercise_type.breakdown) {
        exerciseTypesData.push({
          name: index,
          value: Math.round(stats.exercise_type.breakdown[index])
        });
      }

      const musclegroupsData = [];
      for (const index in stats.musclegroup.breakdown) {
        musclegroupsData.push({
          name: index,
          value: Math.round(stats.musclegroup.breakdown[index])
        });
      }

      const series = [
        {
          name: this.translate.instant('Exercise Type'),
          type: 'pie',
          selectedMode: 'single',
          radius: [0, '50%'],
          label: {
            show: false
          },
          labelLine: {
            show: false
          },
          data: exerciseTypesData
        },
        {
          name: this.translate.instant('Muscle Group'),
          type: 'pie',
          radius: ['65%', '100%'],
          labelLine: {
            length: 30
          },
          label: {
            show: false
          },
          data: musclegroupsData
        }
      ];

      instance.setOption({
        series: series
      }, { replaceMerge: ['series'] });
    }
  }

  // Date formatting methods
  dateFromNow(weeks: number): string {
    return moment().subtract(weeks, 'weeks').locale(this.translate.getDefaultLang()).format('Do MMM YYYY');
  }

  formatDate(date: string): string {
    return moment(date).locale(this.translate.getDefaultLang()).format('Do MMM YYYY');
  }

  formatFromNow(date: string): string {
    return moment(date).locale(this.translate.getDefaultLang()).calendar(null, {
      sameDay: '[' + this.translate.instant('Today') + ']',
      nextDay: '[' + this.translate.instant('Tomorrow') + ']',
      nextWeek: 'dddd',
      lastDay: '[' + this.translate.instant('Yesterday') + ']',
      lastWeek: '[' + this.translate.instant('Last') + '] dddd',
      sameElse: 'Do MMM YYYY'
    });
  }
}
