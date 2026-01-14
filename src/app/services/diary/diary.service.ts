import { inject, Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { StorageService } from '../storage/storage.service';
import { BehaviorSubject, Observable } from 'rxjs';
import moment from 'moment';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DiaryService {
  private diaryObservable: BehaviorSubject<any>;
  private diaryDataObservable: BehaviorSubject<any>;
  private selectedDate: BehaviorSubject<any>;
  private readonly http = inject(HttpClient);

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
      exerciseid: workoutExerciseId,
      reps: setData.reps,
      weight: setData.weight,
      sets: setData.sets,
      rpe: setData.rpe,
      percentage: setData.percentage,
      distance: setData.distance,
      time: setData.time,
      type: setData.type,
      unit: setData.unit,
      completed: setData.completed,
      assigneddate: setData.assigneddate
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

  removeWorkoutPool(date: string, addId: number, updatedDiary: any): Promise<any> {
    return this.request.modify('edit', 'removeworkoutpool', { addid: addId });
  }

  removePoolWorkout(workoutId: number): Promise<any> {
    return this.request.modify('edit', 'removeworkoutpool', { workoutid: workoutId });
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
      const videoUrl = environment.apiUrl.replace("index.php", "") + response;
      return videoUrl;
    });
  }

  // Stats methods
  getNotesStats(exerciseId: number | null): Promise<any> {
    return this.request.get('view', 'getdata', `notesstats${exerciseId}`, { type: 'notes', exerciseid: exerciseId });
  }

  getMostTrackedExercises(): Promise<any> {
    return this.request.get('view', 'getmosttrackedexercises', 'mosttracked', {});
  }

  getTotalVolumePerExercise(): Promise<any> {
    return this.request.get('view', 'gettotalvolumeperexercise', 'totalvolumes', {});
  }

  getIntensityZones(options: any): Promise<any> {
    let key = '';
    for (const index in options) {
      key = key + options[index];
    }
    return this.request.get('view', 'getintensityzones', `intensityzones${key}`, options);
  }

  getFatigueData(options: any): Promise<any> {
    let key = '';
    for (const index in options) {
      key = key + options[index];
    }
    return this.request.get('view', 'getfatiguedata', `fatiguedata${key}`, options);
  }

  getRecordHistory(options: any): Promise<any> {
    let key = '';
    for (const index in options) {
      key = key + options[index];
    }
    return this.request.get('view', 'getrecordshistory', `recordhistory${key}`, options);
  }

  exportDiary(userId: number): Promise<any> {
    return this.request.get('view', 'getexport', `export${userId}`, { userid: userId });
  }

  importDiary(file: File, userId: number, importType: string): Promise<any> {
    const formData = new FormData();
    formData.append('fileToUpload', file, file.name);
    formData.set('userid', userId.toString());
    formData.set('type', importType);
    return this.request.upload('uploadimport', formData);
  }

  // Advanced import methods for CSV import workflow


  public uploadImport(csvFile: File, userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get("intensity__session").then((session) => {
        const formData: FormData = new FormData();
        formData.append('fileToUpload', csvFile, csvFile.name);
        formData.set("key", environment.apiKey);
        formData.set("controller", "edit");
        formData.set("action", "uploadimportfile");
        formData.set("userid", userId + "");
        formData.set("session", session);

        this.http.post(environment.apiUrl, formData).subscribe(
          (res: any) => {
            if (res["success"] === true) {
              let importUrl = environment.apiUrl.replace("index.php", "") + res.data;
              resolve(importUrl);
            } else {
              reject(res);
            }
          },
          (e) => {
            reject(e);
          }
        );
      });
    });
  }


  getCSVData(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fetch(url)
        .then(response => response.text())
        .then(data => resolve(data))
        .catch(error => reject(error));
    });
  }

  getImports(): Promise<any> {
    return this.request.get('view', 'getimports', 'imports', {});
  }

  importFile(fileUrl: string, delimiter: string, mapping: string, importType: string): Promise<any> {
    return this.request.modify('edit', 'importfile', {
      file: fileUrl,
      delimiter,
      mapping,
      importtype: importType
    });
  }
}

