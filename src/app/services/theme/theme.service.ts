import { Injectable, signal, effect } from '@angular/core';
import { StorageService } from '../storage/storage.service';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  public currentTheme = signal<Theme>('system');
  public effectiveTheme = signal<'light' | 'dark'>('light');

  constructor(private storage: StorageService) {
    this.initializeTheme();

    // Effect to apply theme changes
    effect(() => {
      this.applyTheme(this.effectiveTheme());
    });

    // Effect to persist theme changes
    effect(() => {
      const theme = this.currentTheme();
      this.storage.set('intensity__theme', theme);
    });
  }

  private async initializeTheme(): Promise<void> {
    // Load saved theme preference
    const savedTheme = await this.storage.get('intensity__theme');
    
    if (savedTheme) {
      this.currentTheme.set(savedTheme as Theme);
    }
    // If no saved preference, defaults to 'system' (set in signal initialization)

    this.updateEffectiveTheme();

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.currentTheme() === 'system') {
          this.updateEffectiveTheme();
        }
      });
    }
  }

  private updateEffectiveTheme(): void {
    const theme = this.currentTheme();
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.effectiveTheme.set(prefersDark ? 'dark' : 'light');
    } else {
      this.effectiveTheme.set(theme);
    }
  }

  public setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.updateEffectiveTheme();
  }

  public toggleTheme(): void {
    const current = this.effectiveTheme();
    this.currentTheme.set(current === 'light' ? 'dark' : 'light');
    this.updateEffectiveTheme();
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    const body = document.body;
    
    if (theme === 'dark') {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    }
  }

  public isDark(): boolean {
    return this.effectiveTheme() === 'dark';
  }
}
