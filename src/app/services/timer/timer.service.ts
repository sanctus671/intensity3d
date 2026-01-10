import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { timer } from 'rxjs';
import { StorageService } from '../../services/storage/storage.service';

@Injectable({
    providedIn: 'root'
})
export class TimerService {
    private storage = inject(StorageService);

    public stopwatchDuration: number = 0;
    public countdownTimerDuration: number = 60000;
    public intervalDurations: {restDuration: number, workDuration: number} = {restDuration: 30000, workDuration: 90000};

    public stopwatchProperties: any = {playSound: false, restart: false, time: 60000, started: false, startTimestamp: 0, pauseTimestamp: 0, soundPlaying: false};
    public countdownTimerProperties: any = {playSound: false, repeat: false, time: 60000, started: false, restart: false, startTimestamp: 0, pauseTimestamp: 0};
    public intervalProperties: any = {playSound: false, work: 90000, rest: 30000, sets: 3, started: false, phase: "work", currentSet: 1, startTimestamp: 0, pauseTimestamp: 0};

    public counter: Observable<number> = timer(0, 10);

    public stopwatchSubscription: Subscription | null = null;
    public countdownTimerSubscription: Subscription | null = null;
    public intervalSubscription: Subscription | null = null;

    public activeTimer: string = "stopwatch";

    public timerPropertiesObservable: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    public timerStatusObservable: BehaviorSubject<any> = new BehaviorSubject<any>(null);

    private audioContext: AudioContext | null = null;
    private timerSound: HTMLAudioElement | null = null;

    constructor() { 
        // Initialize audio for web
        this.initializeAudio();
        this.getStoredProperties();
    }

    private initializeAudio(): void {
        // Initialize Web Audio API
        try {
            this.timerSound = new Audio('assets/sounds/timer.mp3');
            this.timerSound.load();
        } catch (error) {
            console.warn('Could not load timer sound:', error);
        }
    }

    private playSound(): void {
        if (this.timerSound) {
            this.timerSound.currentTime = 0;
            this.timerSound.play().catch(error => {
                console.warn('Could not play sound:', error);
            });
        }
    }

    public setAdded(): void {
        if (this.stopwatchProperties.restart && this.stopwatchProperties.started) {
            this.resetStopwatch();
        }
        if (this.countdownTimerProperties.restart) {
            this.resetTimer();
            if (!this.countdownTimerProperties.started) {
                this.startCountdownTimer();
            }
        }
    }

    public startStopwatch(): void {
        this.stopwatchProperties.started = true;

        this.timerStatusObservable.next({
            stopwatchStarted: this.stopwatchProperties.started, 
            countdownTimerStarted: this.countdownTimerProperties.started, 
            intervalStarted: this.intervalProperties.started
        });
        
        if (this.stopwatchProperties.pauseTimestamp > 0) {
            this.stopwatchProperties.startTimestamp = this.stopwatchProperties.startTimestamp + (Math.floor(Date.now()) - this.stopwatchProperties.pauseTimestamp);
        } else {
            this.stopwatchProperties.startTimestamp = Math.floor(Date.now());
        }
        
        this.stopwatchSubscription = this.counter.subscribe(t => { 
            this.stopwatchDuration = (Math.floor(Date.now()) - this.stopwatchProperties.startTimestamp);
            
            if (this.stopwatchProperties.playSound && 
                this.stopwatchProperties.time === (Math.round(this.stopwatchDuration / 1000) * 1000) && 
                !this.stopwatchProperties.soundPlaying) {
                this.stopwatchProperties.soundPlaying = true;
                this.playSound();

                setTimeout(() => {
                    this.stopwatchProperties.soundPlaying = false;
                }, 1000);
            }             
        }); 
    }

    public stopStopwatch(): void {
        this.stopwatchProperties.started = false;

        this.timerStatusObservable.next({
            stopwatchStarted: this.stopwatchProperties.started, 
            countdownTimerStarted: this.countdownTimerProperties.started, 
            intervalStarted: this.intervalProperties.started
        });
        
        this.stopwatchProperties.pauseTimestamp = Math.floor(Date.now());
        
        if (this.stopwatchSubscription) {
            this.stopwatchSubscription.unsubscribe();
        }
    }

    public resetStopwatch(): void {
        this.stopwatchDuration = 0;
        this.stopwatchProperties.pauseTimestamp = 0;
        if (this.stopwatchProperties.started) {
            this.stopwatchProperties.startTimestamp = Math.floor(Date.now());
        } else {
            this.stopwatchProperties.startTimestamp = 0;
        }
    }

    public startCountdownTimer(): void {
        this.countdownTimerProperties.started = true;

        this.timerStatusObservable.next({
            stopwatchStarted: this.stopwatchProperties.started, 
            countdownTimerStarted: this.countdownTimerProperties.started, 
            intervalStarted: this.intervalProperties.started
        });
        
        if (this.countdownTimerProperties.pauseTimestamp > 0) {
            this.countdownTimerProperties.startTimestamp = this.countdownTimerProperties.startTimestamp + (Math.floor(Date.now()) - this.countdownTimerProperties.pauseTimestamp);
        } else {
            this.countdownTimerProperties.startTimestamp = Math.floor(Date.now());
        }                
        
        if (this.countdownTimerDuration <= 0) {
            this.resetCountdownTimer();
        }

        this.countdownTimerSubscription = this.counter.subscribe(t => { 
            this.countdownTimerDuration = this.countdownTimerProperties.time - (Math.floor(Date.now()) - this.countdownTimerProperties.startTimestamp);          

            if (this.countdownTimerDuration <= 0) {
                if (this.countdownTimerProperties.playSound) {
                    this.playSound();
                }
                if (this.countdownTimerProperties.repeat) {
                    this.resetCountdownTimer();
                } else {
                    this.countdownTimerProperties.startTimestamp = 0;
                    this.countdownTimerProperties.pauseTimestamp = 0;                      
                    this.countdownTimerDuration = 0;
                    this.stopCountdownTimer();
                }
            } 
        }); 
    }

    public stopCountdownTimer(): void {
        this.countdownTimerProperties.started = false;

        this.timerStatusObservable.next({
            stopwatchStarted: this.stopwatchProperties.started, 
            countdownTimerStarted: this.countdownTimerProperties.started, 
            intervalStarted: this.intervalProperties.started
        });
        
        this.countdownTimerProperties.pauseTimestamp = Math.floor(Date.now());
        
        if (this.countdownTimerSubscription) {
            this.countdownTimerSubscription.unsubscribe();
        }
    }

    public resetCountdownTimer(): void {
        this.countdownTimerProperties.pauseTimestamp = 0; 
        if (this.countdownTimerProperties.started) {
            this.countdownTimerProperties.startTimestamp = Math.floor(Date.now());
        } else {
            this.countdownTimerProperties.startTimestamp = 0;
        }
        
        this.countdownTimerDuration = this.countdownTimerProperties.time;
    }


    public startIntervalTimer(): void {
        this.intervalProperties.started = true;

        this.timerStatusObservable.next({
            stopwatchStarted: this.stopwatchProperties.started, 
            countdownTimerStarted: this.countdownTimerProperties.started, 
            intervalStarted: this.intervalProperties.started
        });
  
        if (this.intervalDurations.workDuration <= 0 && this.intervalProperties.currentSet >= this.intervalProperties.sets) {
            this.resetIntervalTimer();
        }        

        if (this.intervalProperties.pauseTimestamp > 0) {
            this.intervalProperties.startTimestamp = this.intervalProperties.startTimestamp + (Math.floor(Date.now()) - this.intervalProperties.pauseTimestamp);
        } else {
            this.intervalProperties.startTimestamp = Math.floor(Date.now());
        } 

        this.intervalSubscription = this.counter.subscribe(t => { 
            if (this.intervalProperties.phase === "work") {
                this.intervalDurations.workDuration = this.intervalProperties.work - (Math.floor(Date.now()) - this.intervalProperties.startTimestamp);      

                if (this.intervalDurations.workDuration <= 0) {
                    if (this.intervalProperties.playSound) {
                        this.playSound();
                    }

                    this.intervalDurations.workDuration = 0;
                    if (this.intervalProperties.currentSet < this.intervalProperties.sets) {
                        this.intervalDurations.restDuration = this.intervalProperties.rest;
                        this.intervalProperties.phase = "rest";    
                        this.intervalProperties.startTimestamp = Math.floor(Date.now());      
                    } else {
                        this.stopIntervalTimer();
                    }
                }                 
            } else if (this.intervalProperties.phase === "rest") {
                this.intervalDurations.restDuration = this.intervalProperties.rest - (Math.floor(Date.now()) - this.intervalProperties.startTimestamp);   

                if (this.intervalDurations.restDuration <= 0) {
                    if (this.intervalProperties.playSound) {
                        this.playSound();
                    }
                    this.intervalDurations.restDuration = 0;
                    this.intervalDurations.workDuration = this.intervalProperties.work;
                    this.intervalProperties.phase = "work";
                    this.intervalProperties.currentSet += 1;
                    this.intervalProperties.startTimestamp = Math.floor(Date.now());  
                }
            }
        }); 
    }

    public stopIntervalTimer(): void {
        this.intervalProperties.started = false;
        this.timerStatusObservable.next({
            stopwatchStarted: this.stopwatchProperties.started, 
            countdownTimerStarted: this.countdownTimerProperties.started, 
            intervalStarted: this.intervalProperties.started
        });
        this.intervalProperties.pauseTimestamp = Math.floor(Date.now());
        if (this.intervalSubscription) {
            this.intervalSubscription.unsubscribe();
        }
    }

    public resetIntervalTimer(): void {
        this.intervalDurations.restDuration = this.intervalProperties.rest;
        this.intervalDurations.workDuration = this.intervalProperties.work;
        this.intervalProperties.phase = "work";  
        this.intervalProperties.currentSet = 1;

        this.intervalProperties.pauseTimestamp = 0; 
        if (this.intervalProperties.started) {
            this.intervalProperties.startTimestamp = Math.floor(Date.now());
        } else {
            this.intervalProperties.startTimestamp = 0;
        }
    }


    public resetTimer(): void {
        if (this.stopwatchProperties.started && this.stopwatchProperties.restart) {
            this.resetStopwatch();
        }
        if (this.countdownTimerProperties.started && this.countdownTimerProperties.restart) {
            this.resetCountdownTimer();
        } else if (!this.countdownTimerProperties.started && this.countdownTimerProperties.restart) {
            this.startCountdownTimer();
        }        
    }    
    public formatTime(time: number): string {
        const total = time / 60000;
        const m = Math.floor(total);
        const s = Math.floor(((total - m) * 60));
        return m + ":" + ((s < 10 ? '0' : '') + s);
    } 

    public formatNavTime(time: number): string {
        if (time < 0) {
            time = 0;
        }

        if (time > 59999) {
            const total = time / 60000;
            const m = Math.floor(total);
            const s = Math.floor(((total - m) * 60));
            return m + ":" + ((s < 10 ? '0' : '') + s);
        }
        
        const total = time / 1000;
        const s = Math.floor(total);
        const ms = Math.floor(((total - s) * 100));
 
        return ((s < 10 ? '0' : '') + s) + ":" + ((ms < 10 ? '0' : '') + ms);        
    } 

    public async setStoredProperties(): Promise<void> {
        const stopwatchProperties = {
            playSound: this.stopwatchProperties.playSound, 
            restart: this.stopwatchProperties.restart, 
            time: this.stopwatchProperties.time
        };

        const countdownTimerProperties = {
            playSound: this.countdownTimerProperties.playSound,
            repeat: this.countdownTimerProperties.repeat,
            restart: this.countdownTimerProperties.restart, 
            time: this.countdownTimerProperties.time
        };

        const intervalProperties = {
            playSound: this.intervalProperties.playSound,
            work: this.intervalProperties.work, 
            rest: this.intervalProperties.rest, 
            sets: this.intervalProperties.sets
        };

        const timerProperties = {
            stopwatchProperties,
            countdownTimerProperties,
            intervalProperties,
            activeTimer: this.activeTimer
        };               
        
        await this.storage.set("intensity__timer-properties", JSON.stringify(timerProperties));
    }

    public async getStoredProperties(): Promise<void> {
        const timerProperties = await this.storage.get("intensity__timer-properties");

        if (timerProperties) {
            const timerPropertiesObj = JSON.parse(timerProperties);

            Object.assign(this.stopwatchProperties, timerPropertiesObj.stopwatchProperties);

            Object.assign(this.countdownTimerProperties, timerPropertiesObj.countdownTimerProperties);
            this.countdownTimerDuration = timerPropertiesObj.countdownTimerProperties.time;

            Object.assign(this.intervalProperties, timerPropertiesObj.intervalProperties);
            this.intervalDurations.restDuration = timerPropertiesObj.intervalProperties.rest;
            this.intervalDurations.workDuration = timerPropertiesObj.intervalProperties.work;

            this.activeTimer = timerPropertiesObj.activeTimer;

            this.timerPropertiesObservable.next({timerProperties: timerPropertiesObj});
        }
    }
}
