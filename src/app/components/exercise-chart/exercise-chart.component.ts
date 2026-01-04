import { Component, input, output, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption, ECharts } from 'echarts';
import { DiaryService } from '../../services/diary/diary.service';
import { ChartService } from '../../services/chart/chart.service';

@Component({
  selector: 'app-exercise-chart',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCardModule,
    TranslateModule,
    NgxEchartsModule
  ],
  templateUrl: './exercise-chart.component.html',
  styleUrl: './exercise-chart.component.scss'
})
export class ExerciseChartComponent implements OnInit, OnChanges {
  exercise = input.required<any>();
  user = input<any>({});
  
  chartOptions = signal<EChartsOption>({});
  chartInstance: ECharts | undefined;
  loading = signal(false);
  
  selectedMetrics = signal<string[]>(['volume']);
  timeframe = signal('forever');
  accumulation = signal('weekly');
  
  metrics = ['volume', 'rpe', 'intensity', 'weight', 'volume/wilks', 'best weight', 'estimated 1rm', 'reps', 'rir'];
  
  metricColors: any = {
    'volume': '#D43A35',
    'rpe': '#57423E',
    'intensity': '#717597',
    'weight': '#BFA6A1',
    'volume/wilks': '#A1676B',
    'best weight': '#008F5B',
    'estimated 1rm': '#A7AE9C',
    'reps': '#C64D00',
    'rir': '#F3EED9'
  };
  
  timeframes = [
    { value: 'forever', label: 'Lifetime' },
    { value: '1 Year', label: '1 Year' },
    { value: '6 Months', label: '6 Months' },
    { value: '3 Months', label: '3 Months' },
    { value: '1 Month', label: '1 Month' },
    { value: '1 Week', label: '1 Week' }
  ];
  
  accumulations = ['daily', 'weekly', 'monthly', 'not accumulated'];
  
  extraStats = signal<any>({});

  constructor(
    private diaryService: DiaryService,
    private chartService: ChartService
  ) {}

  ngOnInit(): void {
    this.loadChartData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['exercise']) {
      this.loadChartData();
    }
  }

  async loadChartData(): Promise<void> {
    this.loading.set(true);
    try {
      await this.updateChart();
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async updateChart(): Promise<void> {
    const metrics = this.selectedMetrics();
    const data: any[] = [];
    const stats: any = {};

    for (const metric of metrics) {
      try {
        const params = {
          accumulation: this.accumulation(),
          timeframe: this.timeframe(),
          metric: metric,
          name: this.exercise().name
        };

        // TODO: Call actual API
        // const metricData = await this.diaryService.getStats(params);
        
        // For now, use sample data
        const metricData = this.generateSampleData();
        
        data.push(...metricData.map((d: any) => ({
          date: d.x,
          [metric]: d.y
        })));

        stats[metric] = this.calculateStats(metricData);
      } catch (error) {
        console.error(`Error loading ${metric} data:`, error);
      }
    }

    this.extraStats.set(stats);
    
    const options = this.chartService.getLineChartOptions(
      data,
      metrics,
      this.metricColors
    );
    
    this.chartOptions.set(options);
  }

  private generateSampleData(): any[] {
    // Generate sample data for demonstration
    const data = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        x: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        y: Math.floor(Math.random() * 1000) + 500
      });
    }
    return data.reverse();
  }

  private calculateStats(data: any[]): any {
    if (!data || data.length === 0) {
      return { best: {}, worst: {}, average: {}, median: {}, sum: {} };
    }

    const values = data.map(d => d.y);
    const sorted = [...values].sort((a, b) => a - b);
    
    return {
      best: { data: Math.max(...values), date: data.find(d => d.y === Math.max(...values))?.x },
      worst: { data: Math.min(...values), date: data.find(d => d.y === Math.min(...values))?.x },
      average: { data: Math.round(values.reduce((a, b) => a + b, 0) / values.length) },
      median: { data: sorted[Math.floor(sorted.length / 2)] },
      sum: { data: values.reduce((a, b) => a + b, 0) }
    };
  }

  onChartInit(chart: ECharts): void {
    this.chartInstance = chart;
  }

  changeTimeframe(timeframe: string): void {
    this.timeframe.set(timeframe);
    this.updateChart();
  }

  changeAccumulation(accumulation: string): void {
    this.accumulation.set(accumulation);
    this.updateChart();
  }

  onMetricsChange(): void {
    this.updateChart();
  }

  formatMetricName(metric: string): string {
    return metric.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getMetricUnits(metric: string): string {
    const units: any = {
      'volume': ' kg',
      'weight': ' kg',
      'best weight': ' kg',
      'estimated 1rm': ' kg',
      'reps': '',
      'rpe': '',
      'rir': '',
      'intensity': '%',
      'volume/wilks': ''
    };
    return units[metric] || '';
  }
}
