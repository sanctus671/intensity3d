import { Component, OnInit, ChangeDetectionStrategy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';

import { ExerciseService } from '../../services/exercise/exercise.service';
import { RecordsComponent } from '../../dialogs/records/records.component';

interface Exercise {
  exerciseid: number;
  name: string;
  category?: string;
  muscle_group?: string;
  recordsPage?: boolean;
}

@Component({
  selector: 'app-records',
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    TranslateModule
  ],
  templateUrl: './records.component.html',
  styleUrls: ['./records.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecordsPageComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly exerciseService = inject(ExerciseService);

  public readonly isLoading = signal<boolean>(true);
  public readonly searchTerm = signal<string>('');
  public readonly exercises = signal<Exercise[]>([]);

  public readonly filteredExercises = computed(() => {
    const search = this.searchTerm();
    const allExercises = this.exercises();
    
    if (!search) {
      return allExercises;
    }

    const lowerSearch = search.toLowerCase();
    return allExercises.filter(exercise =>
      exercise.name.toLowerCase().includes(lowerSearch) ||
      (exercise.category && exercise.category.toLowerCase().includes(lowerSearch)) ||
      (exercise.muscle_group && exercise.muscle_group.toLowerCase().includes(lowerSearch))
    );
  });

  ngOnInit(): void {
    this.loadExercises();
  }

  private async loadExercises(): Promise<void> {
    try {
      const data = await this.exerciseService.getRecentExercises(99);
      this.exercises.set(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      this.snackBar.open('Failed to load exercises', 'Close', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  public selectExercise(exercise: Exercise): void {
    const exerciseWithFlag = { ...exercise, recordsPage: true };
    
    this.dialog.open(RecordsComponent, {
      width: '550px',
      data: { exercise: exerciseWithFlag },
      autoFocus: false
    });
  }

  public clearSearch(): void {
    this.searchTerm.set('');
  }
}
