import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { StorageService } from '../storage/storage.service';

@Injectable({
  providedIn: 'root'
})
export class LeaderboardService {
  constructor(
    private request: RequestService,
    private storage: StorageService
  ) {}

  setLeaderboardExercises(exercises: any) {
    return this.storage.set('intensity__leaderboardexercises', JSON.stringify(exercises));
  }

  getLeaderboardExercises() {
    return this.storage.get('intensity__leaderboardexercises');
  }

  getLeaderboard(params: { exerciseid: string; reps: number; page: number; limit: number; type: string }): Promise<any> {
    return this.request.get(
      'view', 
      'getleaderboard', 
      `leaderboard${params.type}${params.exerciseid}${params.reps}${params.page}${params.limit}`, 
      params
    );
  }

  likeSet(setId: string): Promise<any> {
    return this.request.modify('create', 'likeset', { id: setId });
  }

  unlikeSet(setId: string): Promise<any> {
    return this.request.modify('edit', 'unlikeset', { id: setId });
  }
}
