import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  public remainingTime = signal(0);
  public isRunning = signal(false);
  private interval: any;

  startTimer(seconds: number): void {
    this.stopTimer();
    this.remainingTime.set(seconds);
    this.isRunning.set(true);

    this.interval = setInterval(() => {
      const current = this.remainingTime();
      if (current > 0) {
        this.remainingTime.set(current - 1);
      } else {
        this.stopTimer();
        this.onTimerComplete();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning.set(false);
  }

  resetTimer(): void {
    this.stopTimer();
    this.remainingTime.set(0);
  }

  private onTimerComplete(): void {
    // Play notification sound or show notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Intensity', {
        body: 'Rest timer completed!',
        icon: '/favicon.ico'
      });
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
