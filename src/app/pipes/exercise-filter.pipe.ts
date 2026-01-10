import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'exerciseFilter'
})
export class ExerciseFilterPipe implements PipeTransform {
  transform(items: Array<any>, filterCategory: any): Array<any> {
    if (!filterCategory || filterCategory.name === "All Exercises") {
      return items;
    }

    const filteredItems = items.filter((item) => {
      const itemTypes: string = item.type;
      const itemMuscleGroups: string = item.musclegroup;
      const exerciseTypes: Array<any> = itemTypes.split(',').map(type => type.trim());
      const muscleGroups: Array<any> = itemMuscleGroups.split(',').map(group => group.trim());

      // Check if any of the exercise types match the filter
      const exerciseTypeMatches = (itemTypes ? true : false) && exerciseTypes.some(type => filterCategory.exercisetypes.includes(type));

      // Check if any of the muscle groups match the filter
      const muscleGroupMatches = (itemMuscleGroups ? true : false) && muscleGroups.some(group => filterCategory.musclegroups.includes(group));

      // Return true if either exercise type or muscle group matches the filter
      return exerciseTypeMatches || muscleGroupMatches;
    });

    return filteredItems;
  }
}
