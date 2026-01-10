import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ECharts, EChartsOption } from 'echarts';
import { NgxEchartsModule } from 'ngx-echarts';
import moment from 'moment';

import { AccountService } from '../../services/account/account.service';
import { BodyweightService } from '../../services/bodyweight/bodyweight.service';
import { ChartService } from '../../services/chart/chart.service';
import { ThemeService } from '../../services/theme/theme.service';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';
import { AddBodyweightComponent } from '../../dialogs/add-bodyweight/add-bodyweight.component';
import { ImportBodyweightComponent } from '../../dialogs/import-bodyweight/import-bodyweight.component';

interface Bodyweight {
  id?: number;
  weight: number;
  created: string;
  request_id?: string;
}

@Component({
  selector: 'app-bodyweight',
  templateUrl: './bodyweight.component.html',
  styleUrls: ['./bodyweight.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule,
    NgxEchartsModule
  ]
})
export class BodyweightComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly accountService = inject(AccountService);
  private readonly bodyweightService = inject(BodyweightService);
  private readonly chartService = inject(ChartService);
  private readonly translate = inject(TranslateService);
  public readonly themeService = inject(ThemeService);

  // Signals
  account = signal<any>({ units: 'lbs' });
  isLoading = signal<boolean>(true);
  bodyweights = signal<Bodyweight[]>([]);
  chartOptions = signal<EChartsOption>({});
  chartInstance = signal<ECharts | undefined>(undefined);
  visibleCount = signal<number>(10); // Show 10 entries initially
  
  // Computed signals
  visibleBodyweights = computed(() => {
    return this.bodyweights().slice(0, this.visibleCount());
  });
  
  hasMore = computed(() => {
    return this.bodyweights().length > this.visibleCount();
  });

  async ngOnInit(): Promise<void> {
    try {
      // Initialize chart options immediately so the chart renders
      this.initializeBaseChartOptions();
      
      const account = await this.accountService.getAccountLocal();
      this.account.set(account || { units: 'lbs' });
      
      await this.loadBodyweights();
    } catch (error) {
      console.error('Error initializing bodyweight component:', error);
      this.isLoading.set(false);
    }
  }

  private initializeBaseChartOptions(): void {
    const options = this.chartService.getLineChartOptions();
    
    options.yAxis = [{
      type: 'value',
      splitLine: {
        show: true,
        lineStyle: {
          color: this.themeService.isDark() ? 'rgba(255, 255, 255, 0.1)' : '#e1e1e0'
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
      name: this.translate.instant('Weight'),
      type: 'line',
      data: [],
      color: '#D44735',
      smooth: true
    }];
    
    this.chartOptions.set(options);
  }

  private async loadBodyweights(): Promise<void> {
    try {
      this.isLoading.set(true);
      const data = await this.bodyweightService.getBodyweightEntries();
      
      if (data && Array.isArray(data)) {
        const sorted = data.sort((a: any, b: any) => {
          const aDate = new Date(a.created);
          const bDate = new Date(b.created);
          if (aDate > bDate) return -1;
          if (aDate < bDate) return 1;
          return 0;
        });
        
        this.bodyweights.set(sorted);
        
        // Reset visible count when reloading data
        this.visibleCount.set(10);
        
        // Update chart with data once instance is ready (defer to avoid setOption during main process)
        setTimeout(() => this.updateChart(sorted));
      }
    } catch (error) {
      console.error('Error loading bodyweights:', error);
      this.snackBar.open(
        this.translate.instant('Failed to load bodyweight entries'),
        this.translate.instant('Close'),
        { duration: 3000 }
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private updateChart(data: Bodyweight[]): void {
    const instance = this.chartInstance();
    if (!instance) return;

    // If no data, set empty series
    if (!data.length) {
      instance.setOption({
        series: [{
          name: this.translate.instant('Weight'),
          type: 'line',
          data: [],
          color: '#D44735',
          smooth: true
        }]
      }, { replaceMerge: ['series'] });
      return;
    }

    const series = [{
      name: this.translate.instant('Weight') + ` (${this.account().units})`,
      type: 'line',
      data: data.map((item: any) => ({
        name: item.created,
        value: [item.created, parseFloat(item.weight)]
      })),
      animationDelay: (idx: number) => idx * 10,
      color: '#D44735',
      smooth: true
    }];

    instance.setOption({
      series: series
    }, { replaceMerge: ['series'] });

    instance.dispatchAction({
      type: 'dataZoom',
      start: 0,
      end: 100
    });
  }

  public onChartInit(chart: ECharts): void {
    this.chartInstance.set(chart);
    
    // Defer update to avoid calling setOption during main process
    setTimeout(() => {
      const data = this.bodyweights();
      if (data.length > 0) {
        this.updateChart(data);
      }
    });
  }

  public formatDate(date: string): string {
    return moment(date)
      .locale(this.translate.getDefaultLang())
      .format('MMMM Do YYYY');
  }

  public async addBodyweight(): Promise<void> {
    const dialogRef = this.dialog.open(AddBodyweightComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {}
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result && result.bodyweight) {
      try {
        const bodyweight = result.bodyweight;
        
        // Optimistically add to list
        const currentBodyweights = this.bodyweights();
        currentBodyweights.unshift(bodyweight);
        this.bodyweights.set([...currentBodyweights]);
        this.updateChart(this.bodyweights());

        // Save to backend
        await this.bodyweightService.addBodyweightEntry(
          bodyweight.created,
          parseFloat(bodyweight.weight),
          this.account().units
        );

        this.snackBar.open(
          this.translate.instant('Entry added!'),
          this.translate.instant('Close'),
          { duration: 3000 }
        );
        
        // Reload to get accurate data
        await this.loadBodyweights();
      } catch (error) {
        console.error('Error adding bodyweight:', error);
        this.snackBar.open(
          this.translate.instant('Failed to add entry'),
          this.translate.instant('Close'),
          { duration: 3000 }
        );
        // Reload to restore accurate state
        await this.loadBodyweights();
      }
    }
  }

  public async editBodyweight(index: number, bodyweight: Bodyweight): Promise<void> {
    const dialogRef = this.dialog.open(AddBodyweightComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: { bodyweight }
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result && result.bodyweight) {
      try {
        const updatedBodyweight = result.bodyweight;
        
        // Update in list
        const currentBodyweights = this.bodyweights();
        currentBodyweights[index] = { ...bodyweight, ...updatedBodyweight };
        this.bodyweights.set([...currentBodyweights]);
        this.updateChart(this.bodyweights());

        // Save to backend
        if (bodyweight.id) {
          await this.bodyweightService.updateBodyweightEntry(
            bodyweight.id,
            parseFloat(updatedBodyweight.weight),
            this.account().units
          );
        }

        this.snackBar.open(
          this.translate.instant('Entry updated!'),
          this.translate.instant('Close'),
          { duration: 3000 }
        );
        
        await this.loadBodyweights();
      } catch (error) {
        console.error('Error updating bodyweight:', error);
        this.snackBar.open(
          this.translate.instant('Failed to update entry'),
          this.translate.instant('Close'),
          { duration: 3000 }
        );
        await this.loadBodyweights();
      }
    }
  }

  public async deleteBodyweight(ev: Event, index: number, bodyweight: Bodyweight): Promise<void> {
    ev.preventDefault();
    ev.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: this.translate.instant('Delete Entry'),
        content: this.translate.instant('Are you sure you want to remove this bodyweight entry?')
      }
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result && result.confirm) {
      try {
        // Remove from list
        const currentBodyweights = this.bodyweights();
        currentBodyweights.splice(index, 1);
        this.bodyweights.set([...currentBodyweights]);
        this.updateChart(this.bodyweights());

        // Delete from backend
        if (bodyweight.id) {
          await this.bodyweightService.deleteBodyweightEntry(bodyweight.id);
        }

        this.snackBar.open(
          this.translate.instant('Entry removed!'),
          this.translate.instant('Close'),
          { duration: 3000 }
        );
        
        await this.loadBodyweights();
      } catch (error) {
        console.error('Error deleting bodyweight:', error);
        this.snackBar.open(
          this.translate.instant('Failed to remove entry'),
          this.translate.instant('Close'),
          { duration: 3000 }
        );
        await this.loadBodyweights();
      }
    }
  }

  public async openImportExport(): Promise<void> {
    const dialogRef = this.dialog.open(ImportBodyweightComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { userId: this.account().id }
    });

    const result = await dialogRef.afterClosed().toPromise();

    if (result && result.imported) {
      // Reload bodyweights after import
      await this.loadBodyweights();
      this.snackBar.open(
        this.translate.instant('Data imported successfully!'),
        this.translate.instant('Close'),
        { duration: 3000 }
      );
    }
  }

  public showMore(): void {
    this.visibleCount.update(count => count + 10);
  }

  public showAll(): void {
    this.visibleCount.set(this.bodyweights().length);
  }

  public resetView(): void {
    this.visibleCount.set(10);
  }
}
