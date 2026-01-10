import { Injectable } from '@angular/core';
import { EChartsOption, ECharts } from 'echarts';
import moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class ChartService {


    constructor(private translate: TranslateService) { }


    private getVirtualData(year: number) {
      const startDate = moment(`${year}-01-01`);
      const endDate = moment(`${year + 1}-01-01`);
      const dayTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
      const data = [];
    
      for (let date = startDate.clone(); date.isBefore(endDate); date.add(1, 'day')) {
        data.push([
          date.format('YYYY-MM-DD'),
          Math.floor(Math.random() * 10000),
        ]);
      }
  
      return data;
    }





    


    public getHeatmapChartOptions(startDate:string, endDate:string){
        let options: EChartsOption = {
            tooltip: {
              position: 'top',
              formatter: (p:any) => {
                const formattedDate = moment(p.data[0]).locale(this.translate.getDefaultLang()).format("Do MMM, YYYY");
                return '<strong>' + formattedDate + '</strong><br>' + this.translate.instant('Volume') + ': ' + p.data[1];
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
                textStyle: {color:'#8b8888'},
                inRange : {   
                    color: ['#F3EED9b3','#d44735' ] //From smaller to bigger value ->
                    
                },
                formatter: function (value, value2) {
                    let valueFormatted = '' + value;
                    let valueInt = parseInt(valueFormatted);
                    if (valueInt > 999){
                        valueFormatted = `${(Math.floor(valueInt / 1000) * 1000) / 1000}K`
                    }
                    let value2Formatted = '' + value2;
                    let value2Int = parseInt(value2Formatted);
                    if (value2Int > 999){
                        value2Formatted = `${(Math.floor(value2Int / 1000) * 1000) / 1000}K`
                    }

                    return `${valueFormatted} - ${value2Formatted}`;
                    
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
                borderColor:"rgba(139,136,136,0)",
                // Change the background color of the grid here
                color: 'transparent' // Change this to the desired color
                },
            
              yearLabel: { show: false },
              splitLine: {lineStyle:{color:"#8b888899", width:1}},
              dayLabel: {color:"#8b8888"},
              monthLabel: {color: "#8b8888", formatter: (params) => {
                    return moment(params.yyyy + "-" + params.MM + "-01").locale(this.translate.getDefaultLang()).format("MMM");
                },
              }
              
            },
            series:  {
                type: 'heatmap',
                coordinateSystem: 'calendar',
                data: []
              }
          };

          return options;
    }

    public getPieChartOptions(){
        let options: EChartsOption = {
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: {c} ({d}%)',
              confine:true
            },
            legend: {
              show:false
            },
            grid: {
                top:0,
                bottom:0,
              left: '3%',
              right: '4%',
              containLabel: true
            },
            series: [
            ],
            color: ['#D44735','#e0826f','#d99689','#9B392C', '#C04444', '#E8A973', '#E8BF95', '#E5D0A6' ]
            
            
          };

          return options;

    }

    public getBarChartOptions(){


        let options: EChartsOption = {
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            legend: {show:false},
            grid: {
                top:0,
                bottom: 0,
              left: '3%',
              right: '5%',
              containLabel: true
            },
            xAxis: {
              type: 'value',
              boundaryGap: [0, 0.01],
              axisLabel: {
                hideOverlap: true,
              },
              splitLine: {
                lineStyle: {
                    color: '#e1e1e099'
                }
              }
            },
            yAxis: {
              type: 'category',
              data: [],
              axisLabel: {
                width:"120",
                overflow:"truncate"
              }
            },
            series: 
              {
                name: this.translate.instant('Sessions'),
                type: 'bar',
                data: [],
                color: '#d44735'
              }
            
          };

          return options;


    }

    public getZoneBarChartOptions(){


        let options: EChartsOption = {
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              },
              formatter: (params: any) => {
                  let result = '';
                  params.forEach((item: any) => {
                      result += `${item.seriesName}: ${item.value}%<br/>`; // Appends '%' symbol to the value
                  });
                  return result;
              }
            },
            legend: {show:false},
            grid: {
                top:0,
                bottom: 0,
              left: '3%',
              right: '5%',
              containLabel: true
            },
            xAxis: {
              type: 'value',
              boundaryGap: [0, 0.01],
              axisLabel: {
                hideOverlap: true,
              },
              splitLine: {
                lineStyle: {
                    color: '#e1e1e099'
                }
              }
            },
            yAxis: {
              type: 'category',
              data: [],
              axisLabel: {
                width:"80",
                overflow:"truncate"
              }
            },
            series: 
              {
                name: this.translate.instant('Time in zone'),
                type: 'bar',
                data: [],
                color: '#d44735'
              }
            
          };

          return options;


    }



    public getLineChartOptions(){
    let options: EChartsOption = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
            label:  {
              formatter: (params) => {
                return moment(params.value).locale(this.translate.getDefaultLang()).format("dddd, MMMM Do YYYY");
              },
           }
          },
          confine: true
        },
        grid: {
          left: '10%',
          bottom:75,
          top: 20,
        },
        xAxis: {
          type: 'time',
          splitLine: {
            show: false
          },
          axisLabel: {
            hideOverlap: true,
          },
          minInterval:  3600 * 24 * 1000,
          boundaryGap: ['5%', '6%'],  // Make sure the line touches the edges of the chart    
        },
        yAxis: [{

          type: 'value',
          splitLine: {
            show: true,
            lineStyle: {
                color: '#e1e1e099'
            }
          },
          min: 0,
          axisLabel: {
            formatter: (val:number) => {
                if (val > 999){
                    return `${val / 1000}K`
                }
                return `${val}`
                
            }
          }
        },
        { 
            type: 'value',
            show:false,
            min: 0
          } ,
          {
              type: 'value',
              show:false,
              min: 0
            }   
        ],
        dataZoom: [
          {
            type: 'slider',
            throttle: 50,
            backgroundColor: 'rgba(255,255,255,0.7)',
            fillerColor: 'rgba(83,67,65,0.7)',
            dataBackground: { areaStyle: { color: '#e1e1e0' } },
            selectedDataBackground: { areaStyle: { color: 'rgba(83,67,65,1)', shadowColor: 'rgba(83,67,65,1)' } },
            handleStyle: { borderColor: 'rgba(83,67,65,1)' },
            moveHandleStyle: {
              color: 'rgba(83,67,65,0.9)',
              shadowColor: 'rgba(83,67,65,1)',
            },
            brushStyle: {
              color: 'rgba(83,67,65,1)',
              shadowColor: 'rgba(83,67,65,1)',
            },
            emphasis: { handleStyle: { borderColor: 'rgba(83,67,65,1)' }, moveHandleStyle: { color: 'rgba(83,67,65,1)' } },
            bottom: 10,
            show:true,
            labelFormatter: (value) => {
                return moment(value).locale(this.translate.getDefaultLang()).format("Do MMM, YYYY");
              },
              start: 0,
              end: 100,  // Ensure that the entire range is initially selected
          },
        ],
        series: [],
        animationEasing: 'elasticOut',
        animationDelayUpdate: (idx: number) => idx * 5,
      };  
      
      return options;

    }

    public getFatigueCombinedChartOptions(){
        let options: EChartsOption = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            legend: {
                show: false
            },
            grid: {
              left: '10%',
              bottom:20,
              top: 20,
            },
            visualMap: {
                show: false,
                seriesIndex: 1, // Apply only to the line series (index 1)
                pieces: [
                    {
                        lte: 80,
                        color: '#22c55e' // Green - low fatigue
                    },
                    {
                        gt: 80,
                        lte: 150,
                        color: '#f97316' // Orange - medium fatigue
                    },
                    {
                        gt: 150,
                        color: '#ef4444' // Red - high fatigue
                    }
                ],
                outOfRange: {
                    color: '#d44735'
                }
            },
            xAxis: {
                type: 'category',
                data: [],
                axisLabel: {
                    fontSize: 11,
                    hideOverlap: true,
                }
            },                              
            yAxis: [
                {
                    type: 'value',
                    position: 'left',
                    axisLabel: {
                        color: '#8b8888'
                    },
                    splitLine: {
                      show: true,
                      lineStyle: {
                          color: '#e1e1e099'
                      }
                    }
                }
            ],
            series: [
                {
                    name: this.translate.instant('Per-Workout'),
                    type: 'bar',
                    data: [],
                    barMaxWidth: 30
                },
                {
                    name: this.translate.instant('Cumulative'),
                    type: 'line',
                    data: [],
                    smooth: true,
                    lineStyle: {
                        width: 2
                    }
                }
            ]
        };

        return options;
    }

/* 
    public getLineChartOptions(){
        const xAxisData = [];
        const data1 = [];
        const data2 = [];
    
        for (let i = 0; i < 100; i++) {
          xAxisData.push('category' + i);
          data1.push((Math.sin(i / 5) * (i / 5 - 10) + i / 6) * 5);
          data2.push((Math.cos(i / 5) * (i / 5 - 10) + i / 6) * 5);
        }
    
        let options:EChartsOption = {
          legend: {
            data: ['example data 1', 'example data 2'],
            align: 'left',
            bottom: 0,
            show:false
          },
          tooltip: {
            trigger: 'axis',  // You may use 'item' or 'axis' based on your requirement
            axisPointer: {
              type: 'shadow',  // Set the axis pointer type
            },
            confine:true,
          },
          grid: {
            left: '20%',
            bottom: 70,
            top:20
          },
          xAxis: {
            data: xAxisData,
            silent: false,
            splitLine: {
              show: false,
            },
          },yAxis: [
            {
              type: 'value',
            
              position: 'left',
              alignTicks: true,
              axisLine: {
                show: true,
                lineStyle: {
                  color: '#000'
                }
              },
              axisLabel: {
                formatter: '{value}'
              }
            },
            {
              type: 'value',
              name: 'Precipitation',
              show:false,
              position: 'left',
              alignTicks: true,
              offset: 80,
              axisLine: {
                show: true,
                lineStyle: {
                  color: '#000'
                }
              },
              axisLabel: {
                formatter: '{value}'
              }
            }
            
          ],
          dataZoom: [
            {
              type: 'slider',
              throttle: 50,
              backgroundColor: 'white', fillerColor: 'rgba(212,71,53,0.7)',
              dataBackground: {areaStyle: {color:'#e1e1e0'}},
              selectedDataBackground: {areaStyle: {color: 'rgba(212,71,53,1)', shadowColor:"rgba(212,71,53,1)"}},
              handleStyle: {borderColor:"rgba(212,71,53,1)"},
              moveHandleStyle: {
                color:'rgba(212,71,53,0.9)', shadowColor:"rgba(212,71,53,1)"
              },
              brushStyle: {
                color:"rgba(212,71,53,1)", shadowColor:"rgba(212,71,53,1)"
              },
              emphasis: {moveHandleStyle: {color: 'rgba(212,71,53,1)'}},
              bottom:10
            }
          ],
          series: [
            {
              name: 'line',
              type: 'line',
              data: data1,
              animationDelay: (idx:number) => idx * 10,
              color:"#D44735"
            },
            {
              name: 'bar2',
              type: 'line',
              yAxisIndex: 1,
              data: data2,
              animationDelay: (idx:number) => idx * 10 + 100,
              color:"#D44735"
            },
          ],
          animationEasing: 'elasticOut',
          animationDelayUpdate: (idx:number) => idx * 5,    
    
        }     

        return options;   
    }; 
    */


}
