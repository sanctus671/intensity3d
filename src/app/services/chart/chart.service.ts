import { Injectable } from '@angular/core';
import { EChartsOption } from 'echarts';
import moment from 'moment';
import { TranslationService } from '../translation/translation.service';

@Injectable({
  providedIn: 'root'
})
export class ChartService {
  constructor(private translation: TranslationService) {}

  public getHeatmapChartOptions(startDate: string, endDate: string, data: any[]): EChartsOption {
    return {
      tooltip: {
        position: 'top',
        formatter: (p: any) => {
          const formattedDate = moment(p.data[0]).format('Do MMM, YYYY');
          return `<strong>${formattedDate}</strong><br>Volume: ${p.data[1]}`;
        },
        confine: true
      },
      visualMap: {
        min: 0,
        max: 20000,
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#F3EED9b3', '#d44735']
        }
      },
      calendar: {
        bottom: 40,
        left: 30,
        right: 30,
        cellSize: ['auto', 13],
        range: [startDate, endDate],
        itemStyle: {
          borderWidth: 0.5,
          color: 'transparent'
        },
        yearLabel: { show: false }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data
      }
    };
  }

  public getLineChartOptions(data: any[], metrics: string[], colors: any): EChartsOption {
    const series = metrics.map((metric) => ({
      name: metric,
      type: 'line' as const,
      data: data.map(d => [d.date, d[metric]]),
      smooth: true,
      lineStyle: {
        color: colors[metric] || '#d44735',
        width: 2
      },
      itemStyle: {
        color: colors[metric] || '#d44735'
      }
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: metrics,
        bottom: 0
      },
      xAxis: {
        type: 'time'
      },
      yAxis: {
        type: 'value'
      },
      series: series,
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      }
    };
  }

  public getBarChartOptions(data: any[], xField: string, yField: string): EChartsOption {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d[xField])
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        type: 'bar',
        data: data.map(d => d[yField]),
        itemStyle: {
          color: '#d44735'
        }
      }],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      }
    };
  }
}
