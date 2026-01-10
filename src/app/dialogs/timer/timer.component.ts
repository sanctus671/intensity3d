import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { TimerService } from '../../services/timer/timer.service';

interface TimerProperties {
    stopwatchStarted: boolean;
    countdownTimerStarted: boolean;
    intervalStarted: boolean;
}

interface StopwatchProperties {
    playSound: boolean;
    restart: boolean;
    time: number;
    timeMinutes?: number;
    timeSeconds?: number;
}

interface CountdownTimerProperties {
    playSound: boolean;
    restart: boolean;
    repeat: boolean;
    time: number;
    timeMinutes?: number;
    timeSeconds?: number;
}

interface IntervalProperties {
    playSound: boolean;
    work: number;
    rest: number;
    sets: number;
    currentSet?: number;
    phase?: string;
    workMinutes?: number;
    workSeconds?: number;
    restMinutes?: number;
    restSeconds?: number;
}

@Component({
    selector: 'app-timer',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatInputModule,
        MatFormFieldModule,
        MatCheckboxModule,
        MatExpansionModule,
        MatProgressSpinnerModule,
        TranslateModule
    ],
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimerComponent implements OnInit, OnDestroy {
    private dialogRef = inject(MatDialogRef<TimerComponent>);
    private timerService = inject(TimerService);
    private cdr = inject(ChangeDetectorRef);

    activeTab = signal<number>(0);
    properties = signal<TimerProperties>({
        stopwatchStarted: false,
        countdownTimerStarted: false,
        intervalStarted: false
    });

    stopwatchProperties: StopwatchProperties = {
        playSound: false,
        restart: false,
        time: 60000
    };

    countdownTimerProperties: CountdownTimerProperties = {
        playSound: false,
        restart: false,
        repeat: false,
        time: 60000
    };

    intervalProperties: IntervalProperties = {
        playSound: false,
        work: 90000,
        rest: 30000,
        sets: 3
    };

    private subscriptions: Subscription[] = [];

    ngOnInit(): void {
        // Subscribe to timer properties
        const propsSub = this.timerService.timerPropertiesObservable.subscribe((data: any) => {
            if (data?.timerProperties) {
                this.setProperties();
                this.cdr.markForCheck();
            }
        });
        this.subscriptions.push(propsSub);

        // Subscribe to timer status
        const statusSub = this.timerService.timerStatusObservable.subscribe((data: any) => {
            if (data) {
                this.properties.set(data);
                this.cdr.markForCheck();
            }
        });
        this.subscriptions.push(statusSub);

        // Subscribe to counter for continuous UI updates when any timer is running
        const counterSub = this.timerService.counter.subscribe(() => {
            // Only trigger change detection if at least one timer is running
            if (this.properties().stopwatchStarted || 
                this.properties().countdownTimerStarted || 
                this.properties().intervalStarted) {
                this.cdr.markForCheck();
            }
        });
        this.subscriptions.push(counterSub);

        this.setProperties();

        // Set active tab based on service
        const tabMap: Record<string, number> = {
            'stopwatch': 0,
            'countdown': 1,
            'interval': 2
        };
        this.activeTab.set(tabMap[this.timerService.activeTimer] || 0);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    cancel(): void {
        this.dialogRef.close();
    }

    onTabChange(index: number): void {
        this.activeTab.set(index);
        
        const tabNames = ['stopwatch', 'countdown', 'interval'];
        this.timerService.activeTimer = tabNames[index];
        this.timerService.setStoredProperties();
    }

    // Stopwatch methods
    getStopwatchTime(): string {
        return this.timerService.formatNavTime(this.timerService.stopwatchDuration);
    }

    toggleStopwatch(): void {
        if (this.properties().stopwatchStarted) {
            this.timerService.stopStopwatch();
        } else {
            this.timerService.startStopwatch();
        }
    }

    resetStopwatch(): void {
        this.timerService.resetStopwatch();
    }

    async updateStopwatchProperties(): Promise<void> {
        this.stopwatchProperties.time = (
            ((this.stopwatchProperties.timeMinutes || 0) * 60) + 
            (this.stopwatchProperties.timeSeconds || 0)
        ) * 1000;

        this.timerService.stopwatchProperties.playSound = this.stopwatchProperties.playSound;
        this.timerService.stopwatchProperties.time = this.stopwatchProperties.time;
        this.timerService.stopwatchProperties.restart = this.stopwatchProperties.restart;

        await this.timerService.setStoredProperties();
    }

    // Countdown Timer methods
    getCountdownTimerPercentage(): number {
        return Math.round(((this.timerService.countdownTimerDuration / this.countdownTimerProperties.time) * 10000)) / 100;
    }

    getCountdownTimerTime(): string {
        return this.timerService.formatNavTime(this.timerService.countdownTimerDuration);
    }

    toggleCountdownTimer(): void {
        if (this.properties().countdownTimerStarted) {
            this.timerService.stopCountdownTimer();
        } else {
            this.timerService.startCountdownTimer();
        }
    }

    resetCountdownTimer(): void {
        this.timerService.resetCountdownTimer();
    }

    async updateCountdownTimerProperties(): Promise<void> {
        this.countdownTimerProperties.time = (
            ((this.countdownTimerProperties.timeMinutes || 0) * 60) + 
            (this.countdownTimerProperties.timeSeconds || 0)
        ) * 1000;

        this.timerService.countdownTimerProperties.playSound = this.countdownTimerProperties.playSound;
        this.timerService.countdownTimerProperties.time = this.countdownTimerProperties.time;
        this.timerService.countdownTimerProperties.restart = this.countdownTimerProperties.restart;
        this.timerService.countdownTimerProperties.repeat = this.countdownTimerProperties.repeat;

        await this.timerService.setStoredProperties();
    }

    // Interval Timer methods
    getIntervalWorkTime(): string {
        return this.timerService.formatNavTime(this.timerService.intervalDurations.workDuration);
    }

    getIntervalRestTime(): string {
        return this.timerService.formatNavTime(this.timerService.intervalDurations.restDuration);
    }

    getIntervalSets(): number {
        return this.timerService.intervalProperties.currentSet;
    }

    getIntervalPhase(): string {
        return this.timerService.intervalProperties.phase;
    }

    toggleIntervalTimer(): void {
        if (this.properties().intervalStarted) {
            this.timerService.stopIntervalTimer();
        } else {
            this.timerService.startIntervalTimer();
        }
    }

    resetIntervalTimer(): void {
        this.timerService.resetIntervalTimer();
    }

    async updateIntervalTimerProperties(): Promise<void> {
        this.intervalProperties.work = (
            ((this.intervalProperties.workMinutes || 0) * 60) + 
            (this.intervalProperties.workSeconds || 0)
        ) * 1000;
        
        this.intervalProperties.rest = (
            ((this.intervalProperties.restMinutes || 0) * 60) + 
            (this.intervalProperties.restSeconds || 0)
        ) * 1000;

        this.timerService.intervalProperties.work = this.intervalProperties.work;
        this.timerService.intervalProperties.rest = this.intervalProperties.rest;
        this.timerService.intervalProperties.playSound = this.intervalProperties.playSound;
        this.timerService.intervalProperties.sets = this.intervalProperties.sets;

        await this.timerService.setStoredProperties();
    }

    private setProperties(): void {
        // Set active tab
        const tabMap: Record<string, number> = {
            'stopwatch': 0,
            'countdown': 1,
            'interval': 2
        };
        this.activeTab.set(tabMap[this.timerService.activeTimer] || 0);

        // Stopwatch properties
        Object.assign(this.stopwatchProperties, this.timerService.stopwatchProperties);
        if (this.stopwatchProperties.time) {
            this.stopwatchProperties.timeMinutes = Math.floor((this.stopwatchProperties.time / 1000) / 60);
            this.stopwatchProperties.timeSeconds = (this.stopwatchProperties.time / 1000) % 60;
        }

        // Countdown timer properties
        Object.assign(this.countdownTimerProperties, this.timerService.countdownTimerProperties);
        if (this.countdownTimerProperties.time) {
            this.countdownTimerProperties.timeMinutes = Math.floor((this.countdownTimerProperties.time / 1000) / 60);
            this.countdownTimerProperties.timeSeconds = (this.countdownTimerProperties.time / 1000) % 60;
        }

        // Interval properties
        Object.assign(this.intervalProperties, this.timerService.intervalProperties);
        if (this.intervalProperties.work) {
            this.intervalProperties.workMinutes = Math.floor((this.intervalProperties.work / 1000) / 60);
            this.intervalProperties.workSeconds = (this.intervalProperties.work / 1000) % 60;
        }
        if (this.intervalProperties.rest) {
            this.intervalProperties.restMinutes = Math.floor((this.intervalProperties.rest / 1000) / 60);
            this.intervalProperties.restSeconds = (this.intervalProperties.rest / 1000) % 60;
        }

        // Update status
        this.properties.set({
            stopwatchStarted: this.timerService.stopwatchProperties.started,
            countdownTimerStarted: this.timerService.countdownTimerProperties.started,
            intervalStarted: this.timerService.intervalProperties.started
        });
    }
}
