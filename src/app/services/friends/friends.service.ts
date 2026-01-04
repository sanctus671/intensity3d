import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {
  private friendsObservable: BehaviorSubject<any>;

  constructor(private request: RequestService) {
    this.friendsObservable = new BehaviorSubject<any>(null);
  }

  getFriendsObservable() {
    return this.friendsObservable.asObservable();
  }

  setFriendsObservable(update: any) {
    this.friendsObservable.next(update);
  }

  getFriends(): Promise<any> {
    return this.request.get('view', 'getfriends', 'friends', {});
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
