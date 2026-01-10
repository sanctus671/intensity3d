import { Pipe, PipeTransform } from '@angular/core';

interface ExerciseItem {
  name: string;
  category?: string;
  muscle_group?: string;
  [key: string]: unknown;
}

@Pipe({
  name: 'exerciseSearch'
})
export class ExerciseSearchPipe implements PipeTransform {
  transform(exercises: ExerciseItem[] | null | undefined, searchTerm: string): ExerciseItem[] {
    if (!exercises || !searchTerm) {
      return exercises || [];
    }

    const lowerSearch = searchTerm.toLowerCase();
    
    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(lowerSearch) ||
      (exercise.category && exercise.category.toLowerCase().includes(lowerSearch)) ||
      (exercise.muscle_group && exercise.muscle_group.toLowerCase().includes(lowerSearch))
    );
  }
}
