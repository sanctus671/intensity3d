import { Component, OnInit,  OnChanges, SimpleChanges, input, output, inject, Input, Output, EventEmitter, ViewChild, ChangeDetectorRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { ECharts, EChartsOption } from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import moment from 'moment';
import { ChartService } from '../../services/chart/chart.service';
import { DiaryService } from '../../services/diary/diary.service';

@Component({
  selector: 'app-exercise-chart',
  templateUrl: './exercise-chart.component.html',
  styleUrls: ['./exercise-chart.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    TranslateModule,
    NgxEchartsModule
  ]
})
export class ExerciseChartComponent  implements OnChanges, OnInit {
    @Input() exercise: any = {};
    @Input() shouldLoad: number = 0;
    @Input() metricsSelectPosition: string = "top";
    @Input() user: any = {};

    public chartOptions: EChartsOption = {};  
    public chartInstance: ECharts | undefined;

    @Input() properties: any = {
        initialLoad: true,
        loading: true,
        isLoadingData: false,
        selectedMetrics: ['volume'],
        selectedMetricsUnits: { 'volume': '' },
        retrievedMetrics: [],
        timeframe: 'forever',
        accumulation: 'weekly',
        usingAlternateAxis: false
      };
    
    @Output() propertiesChange: EventEmitter<any> = new EventEmitter<any>();
    @Output() loadComplete: EventEmitter<void> = new EventEmitter<void>();

    public extraStats:any = {};
    

    public metrics = ["volume", "rpe", "intensity", "weight", "volume/wilks", "best weight","estimated 1rm","reps", "rir"];

    public metricColors:any = {
        "volume" : "#D43A35",
        "rpe" : "#57423E",
        "intensity" : "#717597",
        "weight" : "#BFA6A1",
        "volume/wilks" : "#A1676B",
        "best weight": "#008F5B",
        "estimated 1rm" : "#A7AE9C",
        "reps" : "#C64D00",
        "rir": "#F3EED9"
    }

    public accumulations = ["daily", "weekly", "monthly", "not accumulated"];

    private readonly chartService = inject(ChartService);
    private readonly diaryService = inject(DiaryService);
    public readonly translate = inject(TranslateService);
    private readonly matIconRegistry = inject(MatIconRegistry);
    private readonly domSanitizer = inject(DomSanitizer);
    private readonly cdr = inject(ChangeDetectorRef);

    @ViewChild('metricsSelect') metricsSelect?: MatSelect;
    @ViewChild('accumulationSelect') accumulationSelect?: MatSelect;
    @ViewChild('accumulationButton', { read: ElementRef }) accumulationButton?: ElementRef;

    constructor() {
        // Register custom SVG icons
        this.matIconRegistry.addSvgIcon(
            'maximum',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icon/maximum.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'minimum',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icon/minimum.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'average',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icon/average.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'median',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icon/median.svg')
        );
        this.matIconRegistry.addSvgIcon(
            'sum',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icon/sum.svg')
        );
    }

    ngOnInit() {

        this.chartOptions = this.chartService.getLineChartOptions();
      


    }

    ngOnChanges(changes: SimpleChanges): void {
        // Handle changes to the exerciseid property here


        if (changes["shouldLoad"]) {
    
            // Perform any actions you need when exerciseid changes
            if (this.shouldLoad === 1){
                this.initialLoad();
            }
            else if (this.shouldLoad > 1){
                this.resetMetricData();
            }
        }

    }

    ionViewDidEnter(){
    }

    public async initialLoad(){
        console.log('initialLoad called, isLoadingData:', this.properties.isLoadingData, 'initialLoad:', this.properties.initialLoad);
        
        // Prevent double loading
        if (this.properties.isLoadingData || !this.properties.initialLoad) {
            console.log('Skipping load - already loading or already loaded');
            return;
        }

        console.log('Starting initial load with exercise:', this.exercise);
        this.properties.isLoadingData = true;
        
        try {
            await this.metricsUpdated();
            console.log('Metrics updated successfully');
        } catch (error) {
            console.error('Error loading chart metrics:', error);
        } finally {
            console.log('Setting initialLoad to false and triggering change detection');
            this.properties.initialLoad = false;
            this.properties.isLoadingData = false;
            this.cdr.markForCheck();
            this.loadComplete.emit();
        }
    }


    public async metricsUpdated(){
        console.log('metricsUpdated called, selectedMetrics:', this.properties.selectedMetrics);

        if (this.properties.selectedMetrics.length < 1){
            this.properties.selectedMetrics = ["volume"];
        }

        const addedMetrics = this.properties.selectedMetrics.filter((metric:string) => !this.properties.retrievedMetrics.includes(metric));
        const removedMetrics = this.properties.retrievedMetrics.filter((metric:string) => !this.properties.selectedMetrics.includes(metric));
        
        console.log('addedMetrics:', addedMetrics, 'removedMetrics:', removedMetrics);
    

        if (removedMetrics.length > 0) {
            // Perform actions for removed metrics
            for (let removedMetric of removedMetrics){
                delete this.extraStats[removedMetric];
                this.properties.retrievedMetrics = this.properties.retrievedMetrics.filter((s:string) => s !== removedMetric);
                this.properties.selectedMetrics = this.properties.selectedMetrics.filter((s:string) => s !== removedMetric);
            }
            this.resetMetricData();
        }

        this.emitPropertiesChange();

        if (addedMetrics.length > 0) {
            console.log('Fetching stats for added metrics...');
            for (let addedMetric of addedMetrics){
                await this.getMetricStats(addedMetric);
            }
            console.log('All metrics fetched');
        } else {
            console.log('No new metrics to fetch');
        }




    }




    public async getMetricStats(metric:string){

        if (this.properties.retrievedMetrics.indexOf(metric) > -1){
            return;
        }

        let params:any = {accumulation:this.properties.accumulation, timeframe:this.properties.timeframe, metric:metric};

        if (this.exercise.isMuscleGroup){
            params["musclegroup"] = this.exercise.name;
        }
        else if (this.exercise.isExerciseType){
            params["type"] = this.exercise.name;
        }
        else{
            params["name"] = this.exercise.name ? this.exercise.name : "";
        }

        try {
            let data:any = await this.diaryService.getStats(params);

            if (data){
                let units = this.getMetricUnits(metric);
                this.properties.selectedMetricsUnits[metric] = units;
                this.extraStats[metric] = this.getExtraStats(data, units); 
                this.addMetricToChart(metric, data); 
                this.properties.retrievedMetrics.push(metric);
            } else {
                console.warn('No data returned for metric:', metric);
            }
        }
        catch (error){
            console.error('Error fetching metric stats:', metric, error);
            throw error; // Re-throw to let initialLoad handle it
        }

    }

    private async resetMetricData(){
        this.properties.retrievedMetrics = [];

        let series:any = [];

        let usingAlternateAxis = false;

        for (let metric of this.properties.selectedMetrics){

            let params:any = {accumulation:this.properties.accumulation, timeframe:this.properties.timeframe, metric:metric};

            if (this.exercise.isMuscleGroup){
                params["musclegroup"] = this.exercise.name;
            }
            else if (this.exercise.isExerciseType){
                params["type"] = this.exercise.name;
            }
            else{
                params["name"] = this.exercise.name ? this.exercise.name : "";
            }


            let data:any = await this.diaryService.getStats(params);
            data.sort((a:any, b:any) => new Date(a.x).getTime() - new Date(b.x).getTime());

            let units = this.getMetricUnits(metric);
            this.properties.selectedMetricsUnits[metric] = units;
            this.extraStats[metric] = this.getExtraStats(data, units); 

            let seriesData:any = {
                name: this.formatMetricName(metric) + (this.properties.selectedMetricsUnits[metric] ? this.properties.selectedMetricsUnits[metric] : ""),
                type: 'line',
                data: data.map((dataItem:any) => ({ name: dataItem.x, value: [dataItem.x, dataItem.y] })),
                animationDelay: (idx: number) => idx * 10,
                color: (this.metricColors[metric] ? this.metricColors[metric] : '#D44735'), // You can customize the color,
                smooth:true
              }

              let shouldUseAlternateAxis = false;
              for (let selectedMetric of this.properties.selectedMetrics){
                if (this.extraStats[selectedMetric] && this.extraStats[selectedMetric].average.data >= 500){
                    shouldUseAlternateAxis = true;
                }
              }

              if (shouldUseAlternateAxis && this.extraStats[metric] && this.extraStats[metric].average.data < 11){
                seriesData["yAxisIndex"] = 1;
                usingAlternateAxis = true;
              }
              else if (shouldUseAlternateAxis && this.extraStats[metric] && this.extraStats[metric].average.data > 10 && this.extraStats[metric].average.data < 500){
                seriesData["yAxisIndex"] = 2;
                usingAlternateAxis = true;
              }

              series.push(seriesData);


            this.properties.retrievedMetrics.push(metric);

        }

        this.properties.usingAlternateAxis = usingAlternateAxis;

 
      
        if (this.chartInstance) {
            this.chartInstance.setOption({
                series: series
            }, { replaceMerge: ['series'] })

            this.chartInstance.dispatchAction({
                type: 'dataZoom', 
                start: 0,  // percentage of starting position; 0 - 100
                end: 100   // percentage of ending position; 0 - 100
            })
        }


        this.emitPropertiesChange();
        this.loadComplete.emit();
    }


    private addMetricToChart(metric: string, metricData: any[]){

        let chartOptions = this.chartInstance?.getOption();

        metricData.sort((a, b) => new Date(a.x).getTime() - new Date(b.x).getTime());
        let series:any =  chartOptions ? chartOptions["series"] : [];


        //when the only metrics are the ones that would use an alternative axis but currently are not because metrics on the main axis are removed. e.g. going from displaying RPE only to RPE and volume

        if (!this.properties.usingAlternateAxis){
   

            let mainAxisMetrics = false;
            let secondaryAxisMetrics = false;
            for (let selectedMetric of this.properties.selectedMetrics){
                if (selectedMetric !== metric && this.extraStats[selectedMetric] && this.extraStats[selectedMetric].average.data >= 500){
                    mainAxisMetrics = true;
                }
                else if (selectedMetric !== metric){
                    secondaryAxisMetrics = true;
                }
            }


            let newMetricSecondaryAxis = false;
            if (this.extraStats[metric] && this.extraStats[metric].average.data < 500){
                newMetricSecondaryAxis = true;
            }

            if (secondaryAxisMetrics && !mainAxisMetrics &&  !newMetricSecondaryAxis){
                this.resetMetricData();
                return;

            }
        }

        let seriesData:any = {
            name: this.formatMetricName(metric) + (this.properties.selectedMetricsUnits[metric] ? this.properties.selectedMetricsUnits[metric] : ""),
            type: 'line',
            data: metricData.map(dataItem => ({ name: dataItem.x, value: [dataItem.x, dataItem.y] })),
            animationDelay: (idx: number) => idx * 10,
            color: (this.metricColors[metric] ? this.metricColors[metric] : '#D44735'), // You can customize the color,
            smooth:true
          }

          let shouldUseAlternateAxis = false;
          for (let selectedMetric of this.properties.selectedMetrics){
            if (this.extraStats[selectedMetric] && this.extraStats[selectedMetric].average.data >= 500){
                shouldUseAlternateAxis = true;
            }
          }

          if (shouldUseAlternateAxis && this.extraStats[metric] && this.extraStats[metric].average.data < 11){
            seriesData["yAxisIndex"] = 1;
          }
          else if (shouldUseAlternateAxis && this.extraStats[metric] && this.extraStats[metric].average.data > 10 && this.extraStats[metric].average.data < 500){
            seriesData["yAxisIndex"] = 2;
          }

        series.push(seriesData);

      
        if (this.chartInstance) {
            this.chartInstance.setOption({
                series: series
            });

            this.chartInstance.dispatchAction({
                type: 'dataZoom', 
                start: 0,  // percentage of starting position; 0 - 100
                end: 100   // percentage of ending position; 0 - 100
            })
        }
    }



    public getMetricUnitsRaw(metric:String){
        let units = "";
        if (metric.indexOf("volume") > -1 || metric.indexOf("weight") > -1){
            if (!this.exercise.unit && this.user){return this.user.units}
            else if(!this.exercise.unit){return units}
            units = this.exercise.unit;
        }
        else if (metric.indexOf("intensity") > -1){
            units = "%";
        }   
        return units;      
    }



    private getMetricUnits(metric:String){
        let units = this.getMetricUnitsRaw(metric);
        if (units){
            units = " (" + units + ")";
        }   
        return units;      
    }
    
    private getExtraStats(data: Array<any>, metricUnits: string) {


        let extraStats: any = {
            best: { data: 0, date: null },
            worst: { data: Infinity, date: null },
            average: { data: 0 },
            median: { data: 0, date: null },
            sum: { data: 0 },
        };
    
        let dataCount = 0;
        let dataSum = 0;
    
        for (const stat of data) {

            if (stat.y && stat.x){
                if (stat.y > extraStats.best.data) {
                    extraStats.best.data = this.roundNumber(stat.y);
                    extraStats.best.date = moment(stat.x).locale(this.translate.getDefaultLang()).format('MMMM Do YYYY');
                }
        
                if (stat.y < extraStats.worst.data) {
                    extraStats.worst.data = this.roundNumber(stat.y);
                    extraStats.worst.date = moment(stat.x).locale(this.translate.getDefaultLang()).format('MMMM Do YYYY');
                }
           
        
                dataCount += 1;
                dataSum += stat.y;
            }
        }

        if (extraStats.worst.data === Infinity){
            extraStats.worst.data = 0;
        }
    
        extraStats.average.data = dataCount > 0 ? this.roundNumber(dataSum / dataCount) : 0; // Round to 2 decimal places
    
        const sortedData = [...data].sort((a, b) => a.y - b.y); // Sort data for median calculation
        const midIndex = Math.floor(dataCount / 2);
        if (dataCount > 0){
            extraStats.median.data = this.roundNumber(sortedData[midIndex].y);
            extraStats.median.date = moment(sortedData[midIndex].x).locale(this.translate.getDefaultLang()).format('MMMM Do YYYY');
        }

        extraStats.sum.data = this.roundNumber(dataSum);
    
        return extraStats; // Assign the calculated extraStats to the class variable
    }
    
   
    
    public changeStatsTimeframe(timeframe:string){
        this.properties.timeframe = timeframe;
        this.resetMetricData();
    }

    public changeStatsAccumulation(){
        this.resetMetricData();
    }   


    public formatMetricName(metric:string){
        if (['rpe', 'rir', '1rm'].includes(metric.toLowerCase())) {
            return metric.toUpperCase();
        } else {
            // Capitalize the first letter of each word
            return this.translate.instant(metric.replace(/\b\w/g, char => char.toUpperCase()));
        }
    }


    public displaySelectedMetrics(){
        // Split the input string into an array of values
        const values = this.properties.selectedMetrics;

        // Map over the values to capitalize each one
        const formattedValues = values.map((value:string) => {
        // Check if the value is one of the special cases (RPE, RIR, 1RM)
        if (['rpe', 'rir', '1rm'].includes(value.toLowerCase())) {
            return value.toUpperCase();
        } else {
            // Capitalize the first letter of each word
            return this.translate.instant(value.replace(/\b\w/g, char => char.toUpperCase()));
        }
        });

        // Join the formatted values into a string with commas and spaces
        const formattedString = formattedValues.join(', ');

        return formattedString;    
    }


    public onChartInit(e: ECharts) {
        this.chartInstance = e;
        console.log('Chart initialized, initialLoad:', this.properties.initialLoad);

        // If we haven't loaded yet (initialLoad is true), trigger the initial load
        if (this.properties.initialLoad){
            console.log('Triggering initial load...');
            this.initialLoad();
        }
    }

    public openMetricsSelect() {
        if (this.metricsSelect) {
            this.metricsSelect.open();
        }
    }

    public openAccumulationSelect() {
        if (this.accumulationSelect) {
            this.accumulationSelect.open();
        }
    }

    public roundNumber(num:number){
        return Math.round(num * 100) / 100
    }

    private emitPropertiesChange() {
        if (this.propertiesChange) {
          this.propertiesChange.emit(this.properties);
        }
    }

}
