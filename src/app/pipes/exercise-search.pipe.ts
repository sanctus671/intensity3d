import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'exerciseSearch'
})
export class ExerciseSearchPipe implements PipeTransform {
  transform(exercises: any[], searchTerm: string): any[] {
    if (!exercises || !searchTerm) {
      return exercises;
    }

    const lowerSearch = searchTerm.toLowerCase();
    
    return exercises.filter(exercise =>
      exercise.name.toLowerCase().includes(lowerSearch) ||
      (exercise.category && exercise.category.toLowerCase().includes(lowerSearch)) ||
      (exercise.muscle_group && exercise.muscle_group.toLowerCase().includes(lowerSearch))
    );
  }
}
