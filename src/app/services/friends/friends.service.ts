import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { StorageService } from '../storage/storage.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private friendsObservable: BehaviorSubject<any>;
  private friendsCache: any = null;
  private friendsCacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    private request: RequestService,
    private storage: StorageService
  ) {
    this.friendsObservable = new BehaviorSubject<any>(null);
  }

  getFriendsObservable() {
    return this.friendsObservable.asObservable();
  }

  setFriendsObservable(update: any) {
    this.friendsObservable.next(update);
  }

  async getFriends(forceRefresh: boolean = false): Promise<any> {
    // Check if cache is valid
    const now = Date.now();
    const cacheIsValid = this.friendsCache && (now - this.friendsCacheTimestamp < this.CACHE_DURATION);
    
    if (!forceRefresh && cacheIsValid) {
      return Promise.resolve(this.friendsCache);
    }

    // Fetch fresh data
    const session = await this.storage.get('intensity__session');
    const data = await this.request.get('view', 'getfriends', 'friends', { sessionid: session });
    
    // Update cache
    this.friendsCache = data;
    this.friendsCacheTimestamp = now;
    this.friendsObservable.next(data);
    
    return data;
  }

  clearFriendsCache(): void {
    this.friendsCache = null;
    this.friendsCacheTimestamp = 0;
  }

  searchFriends(query: string): Promise<any> {
    return this.request.get('view', 'getusers', null, { username: query });
  }

  // Alias for backward compatibility
  searchUsers(query: string): Promise<any> {
    return this.searchFriends(query);
  }

  getSuggestedFriends(userId: number): Promise<any> {
    return this.request.get('view', 'getsuggestedfriends', `suggested_friends_${userId}`, { userid: userId });
  }

  addFriend(userId: number): Promise<any> {
    return this.request.modify('create', 'addfriend', { friendid: userId });
  }

  removeFriend(userId: number): Promise<any> {
    return this.request.modify('edit', 'removefriend', { friendid: userId });
  }

  getFriend(userId: number): Promise<any> {
    return this.request.get('view', 'getfriend', `friend_${userId}`, { id: userId });
  }

  getFriendDiary(userId: number, date: string): Promise<any> {
    return this.request.get('view', 'selectresults', `friend_diary_${userId}_${date}`, { userid: userId, assigneddate: date, v2: true });
  }

  getFriendWorkoutDates(userId: number): Promise<any> {
    return this.request.get('view', 'getfriendworkoutdates', `friend_workout_dates_${userId}`, { userid: userId });
  }

  getWorkout(date: string, userId: number): Promise<any> {
    return this.request.get('view', 'selectresults', `friend_workout_${userId}_${date}`, { assigneddate: date, v2: true, userid: userId });
  }
}
