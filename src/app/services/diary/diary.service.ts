import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { StorageService } from '../storage/storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class DiaryService {
  private diaryObservable: BehaviorSubject<any>;
  private diaryDataObservable: BehaviorSubject<any>;
  private selectedDate: BehaviorSubject<any>;

  constructor(
    private request: RequestService,
    private storage: StorageService
  ) {
    this.diaryObservable = new BehaviorSubject<any>(null);
    this.diaryDataObservable = new BehaviorSubject<any>(null);
    this.selectedDate = new BehaviorSubject<any>(moment());
  }

  // Selected date management (required for diary navigation)
  getSelectedDate(): Observable<any> {
    return this.selectedDate.asObservable();
  }

  setSelectedDate(newDate: any): void {
    this.selectedDate.next(newDate);
  }

  getDiaryObservable() {
    return this.diaryObservable.asObservable();
  }

  setDiaryObservable(update: any) {
    this.diaryObservable.next(update);
  }

  getDiaryDataObservable() {
    return this.diaryDataObservable.asObservable();
  }

  setDiaryDataObservable(update: any) {
    this.diaryDataObservable.next(update);
  }

  getWorkouts(date: string): Promise<any> {
    return this.request.get('view', 'selectresults', `workouts${date}`, { assigneddate: date, v2: true });
  }

  preloadWorkout(date: string): Promise<any> {
    return this.request.get('view', 'selectresults', `preloadworkouts${date}`, { assigneddate: date, v3: true });
  }

  addSet(workoutExerciseId: number, setData: any): Promise<any> {
    const requestData: any = {
      workout_exercise_id: workoutExerciseId,
      reps: setData.reps,
      weight: setData.weight,
      sets: setData.sets,
      rpe: setData.rpe,
      percentage: setData.percentage,
      distance: setData.distance,
      time: setData.time,
      type: setData.type,
      unit: setData.unit,
      completed: setData.completed
    };

    if (setData.multiple) {
      requestData.multiple = setData.multiple;
    }

    return this.request.modify('create', 'addresults', requestData);
  }

  updateSet(setId: number, setData: any): Promise<any> {
    return this.request.modify('edit', 'changeresults', { id: setId, ...setData });
  }

  deleteSet(setId: number): Promise<any> {
    return this.request.modify('edit', 'removeresults', { id: setId });
  }

  addWorkout(date: string, name: string): Promise<any> {
    return this.request.modify('create', 'addworkout', { assigneddate: date, name });
  }

  deleteWorkout(date: string, workoutId: number): Promise<any> {
    return this.request.modify('edit', 'removeworkout', { workoutid: workoutId, assigneddate: date });
  }

  addExercise(date: string, exerciseId: number): Promise<any> {
    return this.request.modify('create', 'addexercise', { assigneddate: date, exerciseid: exerciseId });
  }

  deleteExercise(date: string, exerciseId: number): Promise<any> {
    return this.request.modify('edit', 'removeresults', { exerciseid: exerciseId, assigneddate: date });
  }

  reorderSets(date: string, exerciseId: number, sets: any, updatedDiary?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request.modify('edit', 'changeorder', { sets }).then(async (responseData: any) => {
        if (updatedDiary) {
          await this.request.storeResponse('view', 'selectresults', `workouts${date}`, {}, updatedDiary);
          await this.request.storeResponse('view', 'selectresults', `preloadworkouts${date}`, {}, updatedDiary);
        }
        resolve(responseData);
      }).catch(() => {
        reject(false);
      });
    });
  }

  reorderExercises(date: string, sets: any, updatedDiary?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request.modify('edit', 'changeexerciseorder', { sets }).then(async (responseData: any) => {
        if (updatedDiary) {
          await this.request.storeResponse('view', 'selectresults', `workouts${date}`, {}, updatedDiary);
          await this.request.storeResponse('view', 'selectresults', `preloadworkouts${date}`, {}, updatedDiary);
        }
        resolve(responseData);
      }).catch(() => {
        reject(false);
      });
    });
  }

  copyWorkout(copyData: any): Promise<any> {
    return this.request.modify('create', 'copyworkout', copyData);
  }

  getWorkoutDates(): Promise<any> {
    return this.request.get('view', 'getworkoutdates', 'workoutdates', {});
  }

  getMarkedDates(startDate: string, endDate: string): Promise<any> {
    return this.request.get('view', 'getworkoutdates', `marked_dates_${startDate}_${endDate}`, {});
  }

  getWorkoutPool(): Promise<any> {
    return this.request.get('view', 'getworkoutpool', 'workoutpool', {});
  }

  getDiaryData(): Promise<any> {
    return this.request.get('view', 'getdiarydata', 'diarydata', {});
  }

  // Add workout from pool (required for pooled workout functionality)
  addWorkoutFromPool(workoutId: number, date: string, poolWorkoutId: number): Promise<any> {
    return this.request.modify('create', 'addresults', { 
      workoutid: workoutId, 
      assigneddate: date, 
      pool: poolWorkoutId 
    });
  }

  getStats(options: any): Promise<any> {
    if (options.timeframe && options.timeframe === '1 Week' && options.accumulation !== 'not accumulated') {
      options.accumulation = 'Daily';
    }

    let key = '';
    for (const index in options) {
      key = key + options[index];
    }

    return this.request.get('view', 'getdata', `stats${key}`, options);
  }

  getRecords(exerciseId: number): Promise<any> {
    return this.request.get('view', 'getrecords', `records${exerciseId}`, { exerciseid: exerciseId });
  }

  getHistory(page: number, date: string, exerciseId: number): Promise<any> {
    return this.request.get('view', 'gethistory', `history${exerciseId}${date}${page}`, { 
      exerciseid: exerciseId, 
      assigneddate: date, 
      page, 
      limit: 50 
    });
  }

  getNotes(page: number, exerciseId: number | null): Promise<any> {
    return this.request.get('view', 'getnotes', `notes${exerciseId}page${page}`, { 
      exerciseid: exerciseId, 
      page, 
      limit: 50 
    });
  }

  getWorkoutNotes(assigneddate: string, page: number, limit: number): Promise<any> {
    return this.request.get('view', 'getworkoutnotes', `workoutnotes${assigneddate}-page${page}`, { 
      page, 
      limit, 
      assigneddate 
    });
  }

  saveWorkoutNote(date: string, notes: string, duration: string | null): Promise<any> {
    const requestData: any = { assigneddate: date, notes };
    if (duration) {
      requestData.duration = duration;
    }
    return this.request.modify('edit', 'saveworkoutnotes', requestData);
  }

  updateMaxes(maxes: any): Promise<any> {
    return this.request.modify('create', 'massaddstats', { maxes });
  }

  getMaxes(exerciseIds: any): Promise<any> {
    return this.request.get('view', 'massgetmax', 'exercise_maxes', { exerciseids: exerciseIds });
  }

  removeProgram(addId: number): Promise<any> {
    return this.request.modify('edit', 'removeresults', { addid: addId });
  }

  removeWorkout(date: string, workoutId: number, updatedDiary: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request.modify('edit', 'removeresults', { workoutid: workoutId, assigneddate: date }).then(async (responseData: any) => {
        if (updatedDiary) {
          await this.request.storeResponse('view', 'selectresults', `workouts${date}`, {}, updatedDiary);
          await this.request.storeResponse('view', 'selectresults', `preloadworkouts${date}`, {}, updatedDiary);
        }
        resolve(responseData);
      }).catch(() => {
        reject(false);
      });
    });
  }

  updateExerciseLinks(date: string, exercises: any, updatedDiary: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request.modify('edit', 'updateexerciselinks', { links: exercises, assigneddate: date }).then(async (responseData: any) => {
        if (updatedDiary) {
          await this.request.storeResponse('view', 'selectresults', `workouts${date}`, {}, updatedDiary);
          await this.request.storeResponse('view', 'selectresults', `preloadworkouts${date}`, {}, updatedDiary);
        }
        resolve(responseData);
      }).catch(() => {
        reject(false);
      });
    });
  }

  saveDiary(date: string, updatedDiary: any | null): Promise<void> {
    return new Promise(async (resolve) => {
      await this.request.storeResponse('view', 'selectresults', `workouts${date}`, {}, updatedDiary);
      await this.request.storeResponse('view', 'selectresults', `preloadworkouts${date}`, {}, updatedDiary);
      resolve();
    });
  }

  uploadVideo(mediaFile: File, setId: number): Promise<string> {
    const formData: FormData = new FormData();
    formData.append('fileToUpload', mediaFile, mediaFile.name);
    formData.set("controller", "edit");
    formData.set("action", "uploadvideo");
    formData.set("id", setId + "");
    
    return this.request.upload('uploadvideo', formData).then((response: any) => {
      // Construct video URL from response
      const videoUrl = response.replace('index.php', '') + response;
      return videoUrl;
    });
  }
}

