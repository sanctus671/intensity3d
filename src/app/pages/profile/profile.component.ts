import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';

import { AccountService } from '../../services/account/account.service';
import { FriendsService } from '../../services/friends/friends.service';
import { DiaryService } from '../../services/diary/diary.service';
import { environment } from '../../../environments/environment';

import { CopyToDateComponent } from '../../dialogs/copy-to-date/copy-to-date.component';
import { EditProfileComponent } from '../../dialogs/edit-profile/edit-profile.component';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';

interface ProfileData {
  id?: number;
  userid?: number;
  username?: string;
  display?: string;
  email?: string;
  age?: number;
  gender?: string;
  about?: string;
  why?: string;
  goals?: string;
  dp?: string;
  units?: string;
  activity?: any[];
  friends?: any[];
  requests?: any[];
  added?: boolean;
  pending?: boolean;
}

interface Properties {
  page: number;
  loading: boolean;
  profileInfoLoading: boolean;
  activityLoading: boolean;
  canloadmore: boolean;
}

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly accountService = inject(AccountService);
  private readonly friendsService = inject(FriendsService);
  private readonly diaryService = inject(DiaryService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly translate = inject(TranslateService);

  // Subscriptions
  private routeSubscription?: Subscription;

  // Signals
  profile = signal<ProfileData>({ activity: [], friends: [], requests: [] });
  account = signal<any>({});
  properties = signal<Properties>({
    page: 1,
    loading: true,
    profileInfoLoading: true,
    activityLoading: true,
    canloadmore: true
  });
  showBackButton = signal<boolean>(false);
  isOwnProfile = signal<boolean>(false); 

  async ngOnInit(): Promise<void> {
    try {
      // Check for account data passed via router state first
      const navigation = this.router.getCurrentNavigation();
      const accountData = navigation?.extras?.state?.['account'] || 
                         window.history.state?.account;
      
      let account;
      if (accountData) {
        // Use the passed account data immediately
        account = accountData;
        this.account.set(account);
      } else {
        // Fall back to loading from local storage
        account = await this.accountService.getAccountLocal();
        this.account.set(account);
      }

      // Subscribe to route parameter changes to handle navigation between different profiles
      this.routeSubscription = this.route.params.subscribe(async (params) => {
        const userId = params['userid'];
        
        // Immediately set whether this is own profile based on route parameter
        // If no userid param, it's own profile; if there is a userid, it's someone else's
        this.isOwnProfile.set(!userId);
        
        // Reset profile state when userId changes
        this.properties.update(p => ({
          page: 1,
          loading: true,
          profileInfoLoading: true,
          activityLoading: true,
          canloadmore: true
        }));
        
        // Check for friend data passed via router state
        const friendData = navigation?.extras?.state?.['friend'] || 
                          window.history.state?.friend;

        if (!userId) {
          // Viewing own profile - never show back button
          this.showBackButton.set(false);
          
          // If we have account data from navigation, use it immediately
          if (accountData) {
            this.profile.set({
              ...accountData,
              activity: [],
              friends: [],
              requests: []
            });
            // Set loading to false so the UI shows the basic info immediately
            this.properties.update(p => ({ ...p, loading: false }));
          } else {
            this.profile.set({
              ...account,
              activity: [],
              friends: [],
              requests: []
            });
          }
          await this.getProfile(account.id);
        } else {
          // Viewing another user's profile
          // Only show back button if we came from friends page (has friendData)
          this.showBackButton.set(!!friendData);
          
          // If we have friend data from navigation, display it immediately
          if (friendData) {
            this.profile.set({
              userid: userId,
              username: friendData.username,
              display: friendData.display,
              dp: friendData.dp,
              added: friendData.added,
              activity: [],
              friends: [],
              requests: []
            });
            // Set loading to false so the UI shows the basic info
            this.properties.update(p => ({ ...p, loading: false }));
          } else {
            this.profile.set({
              userid: userId,
              activity: [],
              friends: [],
              requests: []
            });            
          }
          
          // Then load the full profile with activity etc.
          await this.getProfile(userId);
        }
      });
    } catch (error) {
      console.error('Error loading account:', error);
      this.properties.update(p => ({ ...p, loading: false }));
    }
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  private async getProfile(userId: number): Promise<void> {
    try {
      const profile = await this.accountService.getProfile(userId);
      
      // Check if current user is in the profile's friends list
      if (profile.friends?.indexOf(this.account().id) > -1) {
        profile.added = true;
      }

      // Check if there's a pending friend request
      for (const request of profile.requests || []) {
        if (request.userid === this.account().id) {
          profile.pending = true;
          break;
        }
      }

      this.profile.set(profile);
      this.properties.update(p => ({ 
        ...p, 
        loading: false,
        profileInfoLoading: false,
        activityLoading: false
      }));

      // Load activity separately after profile is displayed
      //await this.getProfileActivity(userId);
    } catch (error) {
      console.error('Error loading profile data:', error);
      this.properties.update(p => ({ 
        ...p, 
        loading: false,
        profileInfoLoading: false,
        activityLoading: false
      }));
    }
  }

  private async getProfileActivity(userId: number): Promise<void> {
    this.properties.update(p => ({ ...p, activityLoading: true }));

    try {
      const activityData = await this.accountService.getUserActivity(userId, 1);
      
      // Update profile with activity data
      this.profile.update(p => ({
        ...p,
        activity: activityData.activity || []
      }));
      
      this.properties.update(p => ({ 
        ...p, 
        activityLoading: false,
        canloadmore: activityData.canloadmore
      }));
    } catch (error) {
      console.error('Error loading profile activity:', error);
      this.properties.update(p => ({ ...p, activityLoading: false }));
    }
  }

  async loadMoreActivity(): Promise<void> {
    this.properties.update(p => ({ ...p, page: p.page + 1, activityLoading: true }));
    
    try {
      const userId = this.profile().userid;
      if (!userId){return;}
      const data = await this.accountService.getUserActivity(
        userId,
        this.properties().page
      );
      
      if (data.activity) {
        this.profile.update(p => ({
          ...p,
          activity: [...p.activity!, ...data.activity]
        }));
      }
      
      this.properties.update(p => ({
        ...p,
        activityLoading: false,
        canloadmore: data.canloadmore
      }));
    } catch (error) {
      console.error('Error loading activity:', error);
      this.properties.update(p => ({ ...p, activityLoading: false }));
    }
  }

  copyExercise(exercise: any): void {
    const dialogRef = this.dialog.open(CopyToDateComponent, {
      width: '300px',
      data: { exercise }
    });

    dialogRef.afterClosed().subscribe(async (data) => {
      if (data?.details) {
        const copyToDate = moment(data.details.date).format('YYYY-MM-DD');
        const copy = {
          userid: this.profile().userid || this.profile().id,
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
          this.snackBar.open(
            this.translate.instant('Failed to copy sets'),
            '',
            { duration: 5000 }
          );
        }
      }
    });
  }

  editProfile(): void {
    const dialogRef = this.dialog.open(EditProfileComponent, {
      width: '500px',
      data: { profile: this.profile() }
    });

    dialogRef.afterClosed().subscribe(async (data) => {
      if (data?.profile) {
        this.profile.update(p => ({ ...p, ...data.profile }));
        
        // Update dp if it was changed
        if (data.dp) {
          this.profile.update(p => ({ ...p, dp: data.dp }));
        }
        
        try {
          await this.accountService.updateProfile(data.profile);
          
          // Update account with new profile data and notify subscribers
          const updatedAccount = { 
            ...this.account(), 
            ...data.profile,
            ...(data.dp ? { dp: data.dp } : {})
          };
          this.account.set(updatedAccount);
          this.accountService.setAccountObservable(updatedAccount);
          
          this.snackBar.open(
            this.translate.instant('Profile updated successfully'),
            '',
            { duration: 3000 }
          );
        } catch (error) {
          this.snackBar.open(
            this.translate.instant('Failed to update profile'),
            '',
            { duration: 3000 }
          );
        }
      }
    });
  }

  async dpFileChangeListener(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const mediaFile = input.files[0];
    const snackBarRef = this.snackBar.open(
      this.translate.instant('File is uploading...'),
      '',
      { duration: 10000 }
    );

    try {
      const image = await this.accountService.uploadDp(mediaFile, this.account().id);
      this.profile.update(p => ({ ...p, dp: image }));
      
      // Update account with new dp and notify subscribers
      const updatedAccount = { ...this.account(), dp: image };
      this.account.set(updatedAccount);
      this.accountService.setAccountObservable(updatedAccount);
      
      snackBarRef.dismiss();
      this.snackBar.open(
        this.translate.instant('Profile picture updated'),
        '',
        { duration: 3000 }
      );
    } catch (error) {
      snackBarRef.dismiss();
      this.snackBar.open(
        this.translate.instant('Failed to upload image'),
        '',
        { duration: 3000 }
      );
    }
  }

  addFriend(): void {
    const profile = this.profile();
    const displayName = profile.display || profile.username;
    const userId = profile.userid || profile.id;
    
    if (!userId) {
      console.error('No user ID available');
      return;
    }
    
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '300px',
      data: {
        title: (profile.pending ? this.translate.instant('Accept') : this.translate.instant('Add')) + ' ' + displayName + '?',
        content: this.translate.instant('Are you sure you want to add this user as a friend?')
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.confirm) {
        try {
          await this.friendsService.addFriend(userId);
          this.snackBar.open(
            this.translate.instant('User added!'),
            '',
            { duration: 5000 }
          );
          this.profile.update(p => ({ ...p, added: true, pending: false }));
        } catch (error) {
          this.snackBar.open(
            this.translate.instant('Failed to add friend'),
            '',
            { duration: 3000 }
          );
        }
      }
    });
  }

  removeFriend(): void {
    const profile = this.profile();
    const displayName = profile.display || profile.username;
    const userId = profile.userid || profile.id;
    
    if (!userId) {
      console.error('No user ID available');
      return;
    }
    
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '300px',
      data: {
        title: this.translate.instant('Remove') + ' ' + displayName + '?',
        content: this.translate.instant('Are you sure you want to remove this user as your friend?')
      }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result?.confirm) {
        try {
          await this.friendsService.removeFriend(userId);
          this.snackBar.open(
            this.translate.instant('Friend removed'),
            '',
            { duration: 5000 }
          );
          this.profile.update(p => ({ ...p, added: false }));
        } catch (error) {
          this.snackBar.open(
            this.translate.instant('Failed to remove friend'),
            '',
            { duration: 3000 }
          );
        }
      }
    });
  }

  uploadDp(): void {
    const fileInput = document.getElementById('dpFile') as HTMLInputElement;
    fileInput?.click();
  }

  formatDate(dateString: string): string {
    return moment(dateString).format('dddd, MMMM Do YYYY');
  }

  formatFromNow(dateString: string): string {
    return moment(dateString).fromNow();
  }

  formatName(item: any): string {
    if (!item) return '';
    let name = item.display ? item.display : item.username;
    if (!name) return '';
    name = name.split("@")[0]; 
    return name;      
  }

  getDp(dp: string): string {
    if (!dp) return '';
    if (dp.startsWith('http')) return dp;
    return environment.apiUrl.replace('index.php', '') + dp;
  }

  goBack(): void {
    this.location.back();
  }
}
