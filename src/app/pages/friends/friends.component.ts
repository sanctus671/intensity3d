import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';

import { AccountService } from '../../services/account/account.service';
import { FriendsService } from '../../services/friends/friends.service';
import { DiaryService } from '../../services/diary/diary.service';
import { environment } from '../../../environments/environment';

import { ShareComponent } from '../../dialogs/share/share.component';
import { CopyToDateComponent } from '../../dialogs/copy-to-date/copy-to-date.component';
import { AddFriendsComponent } from '../../dialogs/add-friends/add-friends.component';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';

interface Friend {
  friendid: string;
  userid: string;
  username: string;
  display?: string;
  dp: string;
}

interface FriendActivity {
  userid: string;
  username: string;
  display?: string;
  dp: string;
  sets: string;
  name: string;
  assigneddate: string;
  reps: string;
  weight: string;
  units: string;
  exerciseid: string;
}

interface Properties {
  loading: boolean;
  activityLoading: boolean;
  requestsLoading: boolean;
  canloadmore: boolean;
  page: number;
}

@Component({
  selector: 'app-friends',
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule,
    MatCardModule,
    MatTabsModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendsComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly friendsService = inject(FriendsService);
  private readonly diaryService = inject(DiaryService);
  private readonly translate = inject(TranslateService);

  public friends = signal<Friend[]>([]);
  public friendActivity = signal<FriendActivity[]>([]);
  public friendRequests = signal<Friend[]>([]);
  public account = signal<any>({});
  public properties = signal<Properties>({
    loading: false,
    activityLoading: true,
    requestsLoading: true,
    canloadmore: true,
    page: 1
  });

  async ngOnInit(): Promise<void> {
    try {
      const account = await this.accountService.getAccountLocal();
      this.account.set(account);
      
      // Check if we have cached data, if so display it immediately
      if (this.friends().length > 0) {
        // We have cached data, set loading states appropriately
        this.properties.update(props => ({
          ...props,
          loading: false,
          activityLoading: false,
          requestsLoading: false
        }));
      } else {
        // No cached data, load everything
        await this.getFriends();
      }
    } catch (error) {
      console.error('Error loading account:', error);
    }
  }

  public async getFriends(): Promise<void> {
    this.properties.update(props => ({ ...props, loading: true }));

    try {
      const data: any = await this.friendsService.getFriends();
      
      const sortedFriends = data.sort((a: Friend, b: Friend) => {
        const nameA = a.display ? a.display : a.username;
        const nameB = b.display ? b.display : b.username;
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
      });

      this.friends.set(sortedFriends);
      this.properties.update(props => ({ ...props, loading: false }));
      
      // Load requests and activity in parallel after friends are loaded
      await Promise.all([
        this.getFriendRequests(),
        this.getFriendActivity()
      ]);
    } catch (error) {
      console.error('Error loading friends:', error);
      this.properties.update(props => ({ ...props, loading: false }));
    }
  }

  private async getFriendActivity(): Promise<void> {
    this.properties.update(props => ({ ...props, activityLoading: true }));

    try {
      const friendActivity: any = await this.accountService.getUserActivity(null, this.properties().page);
      this.friendActivity.set(friendActivity.activity);
      this.properties.update(props => ({ 
        ...props, 
        canloadmore: friendActivity.canloadmore,
        activityLoading: false 
      }));
    } catch (error) {
      console.error('Error loading friend activity:', error);
      this.properties.update(props => ({ ...props, activityLoading: false }));
    }
  }

  private async getFriendRequests(): Promise<void> {
    this.properties.update(props => ({ ...props, requestsLoading: true }));
    
    try {
      const friendRequests: any = await this.accountService.getFriendRequests();
      this.friendRequests.set(friendRequests);
      this.properties.update(props => ({ ...props, requestsLoading: false }));
    } catch (error) {
      console.error('Error loading friend requests:', error);
      this.properties.update(props => ({ ...props, requestsLoading: false }));
    }
  }

  public getDp(dp: string): string {
    return environment.apiUrl.replace('index.php', '') + dp;
  }

  public formatDate(dateString: string): string {
    return moment(dateString).format('dddd, MMMM Do YYYY');
  }

  public formatName(item: any): string {
    if (!item) return '';
    let name = item.display ? item.display : item.username;
    if (!name) return '';
    name = name.split("@")[0]; 
    return name;      
  }

  public viewProfile(friend: Friend, added:boolean = true): void {

    // Navigate with friend data in router state for instant display
    this.router.navigate(['/friends', friend.friendid], {
      state: { 
        friend: {
          userid: friend.friendid,
          username: friend.username,
          display: friend.display,
          dp: friend.dp,
          added: added
        }
      }
    });
  }

  public invite(): void {
    this.dialog.open(ShareComponent, {
      width: '600px',
      data: {
        description: this.translate.instant('Check out Intensity, the workout tracking app at https://www.intensityapp.com'),
        title: 'Intensity'
      }
    });
  }

  public addFriends(): void {
    const dialogRef = this.dialog.open(AddFriendsComponent, {
      width: '400px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(async (data) => {
      if (data && data.user) {
        try {
            this.snackBar.open(
                this.translate.instant('User added!'),
                '',
                { duration: 5000 }
              );

              
          await this.friendsService.addFriend(data.user.userid);
          



          // Clear cache and reload friends
          this.friends.set([]);
          this.friendsService.clearFriendsCache();
          this.accountService.clearRequestsCache();
          await this.getFriends();
          
        } catch (error) {
          console.error('Error adding friend:', error);
        }
      }
    });
  }

  public async loadMoreActivity(): Promise<void> {
    const currentProps = this.properties();
    this.properties.update(props => ({ 
      ...props, 
      page: props.page + 1,
      activityLoading: true 
    }));

    try {
      const data: any = await this.accountService.getUserActivity(null, currentProps.page + 1);
      
      this.friendActivity.update(activity => [...activity, ...data.activity]);
      this.properties.update(props => ({ 
        ...props, 
        canloadmore: data.canloadmore,
        activityLoading: false 
      }));
    } catch (error) {
      console.error('Error loading more activity:', error);
      this.properties.update(props => ({ ...props, activityLoading: false }));
    }
  }

  public copyExercise(exercise: FriendActivity): void {
    const dialogRef = this.dialog.open(CopyToDateComponent, {
      width: '300px',
      data: { exercise }
    });

    dialogRef.afterClosed().subscribe(async (data) => {
      if (data && data.details) {
        const copyToDate = moment(data.details.date).format('YYYY-MM-DD');
        const copy = {
          userid: exercise.userid,
          exerciseid: data.details.type === 'sets' ? data.details.exerciseid : null,
          type: data.details.type,
          date: copyToDate,
          assigneddate: exercise.assigneddate
        };

        this.snackBar.open(
          this.translate.instant('Copying sets...'),
          '',
          { duration: 5000 }
        );

        try {
          await this.diaryService.copyWorkout(copy);
          this.snackBar.open(
            this.translate.instant('Sets copied to') + ' ' + moment(copyToDate).format('MMMM Do YYYY') + '!',
            '',
            { duration: 5000 }
          );
        } catch (error) {
          console.error('Error copying sets:', error);
          this.snackBar.open(
            this.translate.instant('Failed to copy sets'),
            '',
            { duration: 5000 }
          );
        }
      }
    });
  }

  public approveFriend(ev: Event, friend: Friend, index: number): void {
    ev.stopPropagation();
    ev.preventDefault();

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '300px',
      data: {
        title: this.translate.instant('Add') + ' ' + this.formatName(friend) + '?',
        content: this.translate.instant('Are you sure you want to add this user as a friend?')
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.confirm) {
        this.friendRequests.update(requests => requests.filter((_, i) => i !== index));

        try {
          await this.friendsService.addFriend(Number(friend.userid));
          
          // Clear cache and reload
          this.friendsService.clearFriendsCache();
          this.accountService.clearRequestsCache();
          await this.getFriends();
          
          this.snackBar.open(
            this.translate.instant('User approved!'),
            '',
            { duration: 5000 }
          );
        } catch (error) {
          console.error('Error approving friend:', error);
        }
      }
    });
  }

  public declineFriend(ev: Event, friend: Friend, index: number): void {
    ev.stopPropagation();
    ev.preventDefault();

    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '300px',
      data: {
        title: this.translate.instant('Decline') + ' ' + this.formatName(friend) + '?',
        content: this.translate.instant('Are you sure you want to decline this user?')
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.confirm) {
        this.friendRequests.update(requests => requests.filter((_, i) => i !== index));

        try {
          await this.friendsService.removeFriend(Number(friend.userid));
          
          // Clear cache and reload
          this.friendsService.clearFriendsCache();
          this.accountService.clearRequestsCache();
          await this.getFriends();
          
          this.snackBar.open(
            this.translate.instant('User declined'),
            '',
            { duration: 5000 }
          );
        } catch (error) {
          console.error('Error declining friend:', error);
        }
      }
    });
  }
}
