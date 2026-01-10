import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DiaryService } from '../../services/diary/diary.service';
import { ExerciseService } from '../../services/exercise/exercise.service';

interface Exercise {
  exerciseid: string;
  name: string;
  musclegroup: string;
  type: string;
  userid: string;
}

interface VolumeData {
  [key: number]: number;
}

interface BreakdownDetail {
  total_volume: number;
  exercises: Array<{
    name: string;
    volume: number;
    percentage: number;
  }>;
}

interface Breakdown {
  types: {
    [type: string]: BreakdownDetail;
  };
  muscleGroups: {
    [muscleGroup: string]: BreakdownDetail;
  };
  all: BreakdownDetail;
}

@Component({
  selector: 'app-exercise-breakdown',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatTabsModule,
    MatExpansionModule,
    TranslateModule
  ],
  templateUrl: './exercise-breakdown.component.html',
  styleUrls: ['./exercise-breakdown.component.scss']
})
export class ExerciseBreakdownComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ExerciseBreakdownComponent>);
  private diaryService = inject(DiaryService);
  private exerciseService = inject(ExerciseService);
  translate = inject(TranslateService);
  user = inject(MAT_DIALOG_DATA, { optional: true }) || {};

  loading = signal<boolean>(true);
  exerciseTypes = signal<string[]>([]);
  muscleGroups = signal<string[]>([]);
  breakdown = signal<Breakdown>({
    types: {},
    muscleGroups: {},
    all: { total_volume: 0, exercises: [] }
  });

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    this.loading.set(true);
    try {
      const exercises: any = await this.exerciseService.getRecentExercises();
      const exerciseData: any = await this.diaryService.getTotalVolumePerExercise();

      const breakdownData = this.generateBreakdown(exercises, exerciseData);

      this.exerciseTypes.set(breakdownData.exerciseTypes);
      this.muscleGroups.set(breakdownData.muscleGroups);
      this.breakdown.set(breakdownData.breakdown);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      this.loading.set(false);
    }
  }

  private generateBreakdown(exercises: Exercise[], volumeData: VolumeData): { breakdown: Breakdown, exerciseTypes: string[], muscleGroups: string[] } {
    const breakdown: Breakdown = {
      types: {},
      muscleGroups: {},
      all: { total_volume: 0, exercises: [] }
    };

    const returnMuscleGroups: string[] = [];
    const returnExerciseTypes: string[] = [];

    exercises.forEach((exercise) => {
      const exerciseId = parseInt(exercise.exerciseid);
      const volume = volumeData[exerciseId] || 0;

      const types = exercise.type.split(',').map((t) => t.trim()).filter(t => t !== '');
      const muscleGroups = exercise.musclegroup.split(',').map((mg) => mg.trim()).filter(mg => mg !== '');

      // Tally up volume for types
      types.forEach((type) => {
        if (!breakdown.types[type]) {
          breakdown.types[type] = { total_volume: 0, exercises: [] };
          returnExerciseTypes.push(type);
        }
        breakdown.types[type].total_volume += volume;

        const existingExercise = breakdown.types[type].exercises.find(e => e.name === exercise.name);
        if (existingExercise) {
          existingExercise.volume += volume;
        } else {
          breakdown.types[type].exercises.push({ name: exercise.name, volume, percentage: 0 });
        }
      });

      // Tally up volume for muscle groups
      muscleGroups.forEach((muscleGroup) => {
        if (!breakdown.muscleGroups[muscleGroup]) {
          breakdown.muscleGroups[muscleGroup] = { total_volume: 0, exercises: [] };
          returnMuscleGroups.push(muscleGroup);
        }
        breakdown.muscleGroups[muscleGroup].total_volume += volume;

        const existingExercise = breakdown.muscleGroups[muscleGroup].exercises.find(e => e.name === exercise.name);
        if (existingExercise) {
          existingExercise.volume += volume;
        } else {
          breakdown.muscleGroups[muscleGroup].exercises.push({ name: exercise.name, volume, percentage: 0 });
        }
      });

      // Tally up volume for all exercises
      breakdown.all.total_volume += volume;
      const existingExerciseAll = breakdown.all.exercises.find(e => e.name === exercise.name);
      if (existingExerciseAll) {
        existingExerciseAll.volume += volume;
      } else {
        breakdown.all.exercises.push({ name: exercise.name, volume, percentage: 0 });
      }
    });

    // Calculate percentages and sort exercises for types
    for (const type in breakdown.types) {
      const totalVolume = breakdown.types[type].total_volume;
      breakdown.types[type].exercises.forEach(exercise => {
        exercise.percentage = totalVolume ? (exercise.volume / totalVolume) * 100 : 0;
      });
      breakdown.types[type].exercises.sort((a, b) => b.percentage - a.percentage);
    }

    // Calculate percentages and sort exercises for muscle groups
    for (const muscleGroup in breakdown.muscleGroups) {
      const totalVolume = breakdown.muscleGroups[muscleGroup].total_volume;
      breakdown.muscleGroups[muscleGroup].exercises.forEach(exercise => {
        exercise.percentage = totalVolume ? (exercise.volume / totalVolume) * 100 : 0;
      });
      breakdown.muscleGroups[muscleGroup].exercises.sort((a, b) => b.percentage - a.percentage);
    }

    // Calculate percentages and sort exercises for all exercises
    const totalVolumeAll = breakdown.all.total_volume;
    breakdown.all.exercises.forEach(exercise => {
      exercise.percentage = totalVolumeAll ? (exercise.volume / totalVolumeAll) * 100 : 0;
    });
    breakdown.all.exercises.sort((a, b) => b.percentage - a.percentage);

    return { breakdown, exerciseTypes: returnExerciseTypes, muscleGroups: returnMuscleGroups };
  }

  formatVolume(volume: number): string {
    return Math.floor(volume).toLocaleString() + (this.user.units || '');
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
