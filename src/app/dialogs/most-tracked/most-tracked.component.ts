import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DiaryService } from '../../services/diary/diary.service';
import { ExerciseService } from '../../services/exercise/exercise.service';

interface ExerciseWithStats {
  exerciseid: string;
  name: string;
  sessions: number;
  percentageOfTotal: number;
}

@Component({
  selector: 'app-most-tracked',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    TranslateModule
  ],
  templateUrl: './most-tracked.component.html',
  styleUrls: ['./most-tracked.component.scss']
})
export class MostTrackedComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<MostTrackedComponent>);
  private diaryService = inject(DiaryService);
  private exerciseService = inject(ExerciseService);
  translate = inject(TranslateService);

  exercises = signal<ExerciseWithStats[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    this.loading.set(true);
    try {
      const exercises: any = await this.exerciseService.getRecentExercises();
      const exerciseData: { [key: string]: number } = await this.diaryService.getMostTrackedExercises() as { [key: string]: number };

      const totalSessions = Object.values(exerciseData).reduce((total: number, sessions: number) => total + sessions, 0);

      const processedExercises = exercises.map((exercise: any) => {
        const sessions = exerciseData[exercise.exerciseid] || 0;
        const percentageOfTotal = totalSessions > 0 ? (sessions / totalSessions) * 100 : 0;
        
        return {
          exerciseid: exercise.exerciseid,
          name: exercise.name,
          sessions,
          percentageOfTotal
        };
      }).sort((a: ExerciseWithStats, b: ExerciseWithStats) => b.sessions - a.sessions);

      this.exercises.set(processedExercises);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      this.loading.set(false);
    }
  }

  formatNumber(number: number): string {
    return Math.floor(number).toLocaleString();
  }

  formatPercentage(percentage: number): string {
    if (percentage < 1) {
      return '< 1%';
    }
    return percentage.toFixed(0) + '%';
  }

  close() {
    this.dialogRef.close();
  }
}
