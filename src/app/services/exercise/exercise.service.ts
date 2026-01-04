import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { StorageService } from '../storage/storage.service';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {
  constructor(
    private request: RequestService,
    private storage: StorageService
  ) {}

  getExercises(refresh = false): Promise<any> {
    return this.request.get('view', 'getexercises', 'exercises', {}).then((exercises) => {
      // Save to local storage for offline access
      this.storage.set('intensity__exercises', JSON.stringify(exercises));
      return exercises;
    });
  }

  getExercise(exerciseId: number): Promise<any> {
    return this.request.get('view', 'getexercisedata', `exercise_${exerciseId}`, { exerciseid: exerciseId });
  }

  createExercise(exerciseName: string): Promise<any> {
    return this.request.modify('create', 'createexercise', { name: exerciseName });
  }

  updateExercise(exerciseId: number, exerciseData: any): Promise<any> {
    return this.request.modify('edit', 'updateexercise', { id: exerciseId, ...exerciseData });
  }

  deleteExercise(exerciseId: number): Promise<any> {
    return this.request.modify('edit', 'deleteexercise', { id: exerciseId });
  }

  getExerciseHistory(exerciseId: number, limit?: number): Promise<any> {
    return this.request.get('view', 'gethistory', `exercise_history_${exerciseId}`, { exerciseid: exerciseId, limit: limit || 50 });
  }

  getExerciseStats(exerciseId: number, timeframe?: string): Promise<any> {
    return this.request.get('view', 'getexercisestats', `exercise_stats_${exerciseId}_${timeframe}`, { exerciseid: exerciseId, timeframe });
  }

  getExerciseRecords(exerciseId: number): Promise<any> {
    return this.request.get('view', 'getrecords', `exercise_records_${exerciseId}`, { exerciseid: exerciseId });
  }

  getRecentExercises(limit: number = 99): Promise<any> {
    return this.request.get('view', 'selectresults', 'recent_exercises', { type: 'exercises', limit }).then((exercises) => {
      // Save to local storage for offline access
      this.storage.set('intensity__recent-exercises', JSON.stringify(exercises));
      return exercises;
    });
  }

  translateExercise(name: string): Promise<any> {
    return this.request.get('view', 'translateexercise', null, { name });
  }

  getExerciseData(exerciseId: string, assignedDate: string): Promise<any> {
    return this.request.get('view', 'getexercisedata', `exercise_${exerciseId}_${assignedDate}`, { 
      exerciseid: exerciseId, 
      assigneddate: assignedDate 
    });
  }

  getRecommendedExercises(): any[] {
    return [
      { name: 'Squats', id: '2', type: 'Squat', musclegroup: 'Erector Spinae, Gluteus, Hamstrings, Quadriceps', userid: '5' },
      { name: 'Front squats', id: '104', musclegroup: 'Gluteus, Quadriceps', type: 'Squat', userid: '5' },
      { name: 'Bench press', id: '1', type: 'Press', musclegroup: 'Deltoids, Pectoralis, Triceps', userid: '5' },
      { name: 'Incline bench press', id: '105', musclegroup: 'Deltoids, Pectoralis, Triceps', type: 'Press', userid: '5' },
      { name: 'Overhead press', id: '10', type: 'Press', musclegroup: 'Deltoids, Pectoralis, Triceps', userid: '5' },
      { name: 'Deadlifts', id: '6', type: 'Deadlift', musclegroup: 'Erector Spinae, Gluteus, Hamstrings', userid: '5' },
      { name: 'Sumo Deadlift', id: '11', musclegroup: 'Erector Spinae, Gluteus, Hamstrings', type: 'Deadlift', userid: '5' },
      { name: 'Glute ham raise', id: '90', musclegroup: 'Gluteus, Hamstrings', type: '', userid: '5' },
      { name: 'Pullups', id: '5', type: 'Pull', musclegroup: 'Latissimus Dorsi, Rhomboids, Biceps', userid: '5' },
      { id: '73', name: 'Pulldowns', musclegroup: 'Latissimus Dorsi, Rhomboids', type: 'Pull', userid: '5' }
    ];
  }

  getExercisesLocal(): Promise<any> {
    return this.storage.get('intensity__exercises').then((exercises: string | null) => {
      return exercises ? JSON.parse(exercises) : [];
    });
  }

  getRecentExercisesLocal(): Promise<any> {
    return this.storage.get('intensity__recent-exercises').then((exercises: string | null) => {
      return exercises ? JSON.parse(exercises) : [];
    });
  }
}
