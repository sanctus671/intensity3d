import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { AccountService } from '../../services/account/account.service';
import { LeaderboardService } from '../../services/leaderboard/leaderboard.service';
import { AddExerciseComponent } from '../../dialogs/add-exercise/add-exercise.component';
import { LeaderboardExerciseComponent } from '../../dialogs/leaderboard-exercise/leaderboard-exercise.component';
import { ChangeRepsComponent } from '../../dialogs/change-reps/change-reps.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';

type LeaderboardData = {
  [key: string]: {
    assigneddate: string;
    created: string;
    display: null | string;
    dp: string;
    id: string;
    likes: any[];
    unit: 'lbs' | 'kg';
    userid: number;
    username: string;
    weight: string;
  }[];
};

interface Exercise {
  exerciseid: string;
  name: string;
}

@Component({
  selector: 'app-leaderboard',
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TranslateModule
  ]
})
export class LeaderboardComponent implements OnInit {
  private dialog = inject(MatDialog);
  private accountService = inject(AccountService);
  private leaderboardService = inject(LeaderboardService);
  private translate = inject(TranslateService);

  public selectedTab = signal<'maxes' | 'friendsmaxes'>('maxes');
  public selectedExercises = signal<Exercise[]>([
    { exerciseid: '2', name: 'Squats' },
    { name: 'Bench press', exerciseid: '1' },
    { name: 'Deadlifts', exerciseid: '6' }
  ]);

  public leaderboards = signal<LeaderboardData>({ '2': [], '6': [], '1': [] });
  public leaderboardsLoading = signal<{ [key: string]: boolean }>({ '2': true, '6': true, '1': true });
  public leaderboardsReps = signal<{ [key: string]: number }>({ '2': 1, '6': 1, '1': 1 });

  public friendsLeaderboards = signal<LeaderboardData>({ '2': [], '6': [], '1': [] });
  public friendsLeaderboardsLoading = signal<{ [key: string]: boolean }>({ '2': true, '6': true, '1': true });
  public friendsLeaderboardsReps = signal<{ [key: string]: number }>({ '2': 1, '6': 1, '1': 1 });

  private recentExercises: Array<any> = [];
  public user = signal<any>({});

  constructor() {
    this.accountService.getAccountObservable().subscribe((user: any) => {
      if (user && user.id) {
        this.user.set(user);
      }
    });

    this.leaderboardService.getLeaderboardExercises().then(async (data: string) => {
      if (data) {
        const exercises = JSON.parse(data);
        this.selectedExercises.set(exercises);

        const newLeaderboards: LeaderboardData = {};
        const newLeaderboardsLoading: { [key: string]: boolean } = {};
        const newLeaderboardsReps: { [key: string]: number } = {};
        const newFriendsLeaderboards: LeaderboardData = {};
        const newFriendsLeaderboardsLoading: { [key: string]: boolean } = {};
        const newFriendsLeaderboardsReps: { [key: string]: number } = {};

        for (let exercise of exercises) {
          newLeaderboardsLoading[exercise.exerciseid] = true;
          if (!this.leaderboardsReps()[exercise.exerciseid]) {
            newLeaderboardsReps[exercise.exerciseid] = 1;
          } else {
            newLeaderboardsReps[exercise.exerciseid] = this.leaderboardsReps()[exercise.exerciseid];
          }
          newLeaderboards[exercise.exerciseid] = [];

          newFriendsLeaderboardsLoading[exercise.exerciseid] = true;
          if (!this.friendsLeaderboardsReps()[exercise.exerciseid]) {
            newFriendsLeaderboardsReps[exercise.exerciseid] = 1;
          } else {
            newFriendsLeaderboardsReps[exercise.exerciseid] = this.friendsLeaderboardsReps()[exercise.exerciseid];
          }
          newFriendsLeaderboards[exercise.exerciseid] = [];
        }

        this.leaderboards.set(newLeaderboards);
        this.leaderboardsLoading.set(newLeaderboardsLoading);
        this.leaderboardsReps.set(newLeaderboardsReps);
        this.friendsLeaderboards.set(newFriendsLeaderboards);
        this.friendsLeaderboardsLoading.set(newFriendsLeaderboardsLoading);
        this.friendsLeaderboardsReps.set(newFriendsLeaderboardsReps);

        await this.tabChanged();
      } else {
        await this.tabChanged();
      }
    }).catch(async () => {
      await this.tabChanged();
    });
  }

  ngOnInit() {}

  public async tabChanged() {
    for (let exercise of this.selectedExercises()) {
      await this.getLeaderboard(exercise);
    }
  }

  public async viewItem(exercise: Exercise, item: any, rank: number) {
    const name = this.formatName(item);
    
    const message = this.translate.instant('This record for exercise was performed on date. It was entered into their diary on date.', {
      name: this.translate.instant(exercise.name),
      performDate: this.formatDate(item.assigneddate),
      entryDate: this.formatDate(item.created)
    });

    const dialogRef = this.dialog.open(DisplayInformationComponent, {
      width: '400px',
      data: {
        title: `${rank}. ${item.weight}${item.unit}`,
        subtitle: this.translate.instant('Made by') + ' ' + name,
        content: message,
        actions: [
          {
            text: this.translate.instant('Share'),
            handler: () => {
              dialogRef.close();
              this.share(exercise, item, rank);
            }
          }
        ]
      }
    });
  }

  public formatName(item: any): string {
    if (!item) return '';
    let name = item.display ? item.display : item.username;
    if (!name) return '';
    name = name.split('@')[0];
    return name;
  }

  public async share(exercise: Exercise, set: any, rank: number) {
    const name = set.display ? set.display : set.username;
    const reps = this.selectedTab() === 'maxes' 
      ? this.leaderboardsReps()[exercise.exerciseid]
      : this.friendsLeaderboardsReps()[exercise.exerciseid];
    const text = `${name} tracked ${exercise.name} for ${reps} reps with ${set.weight}${set.unit}. They are ranked number ${rank} on the Intensity leaderboard!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Intensity leaderboard',
          text: text,
          url: 'https://www.intensityapp.com'
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text} https://www.intensityapp.com`);
        alert(this.translate.instant('Link copied to clipboard!'));
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  }

  public changeReps(exercise: Exercise) {
    const currentTab = this.selectedTab();
    const currentReps = currentTab === 'maxes' 
      ? this.leaderboardsReps()[exercise.exerciseid]
      : this.friendsLeaderboardsReps()[exercise.exerciseid];

    const dialogRef = this.dialog.open(ChangeRepsComponent, {
      width: '400px',
      data: { reps: currentReps }
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.reps) {
        if (currentTab === 'maxes') {
          this.leaderboardsReps.update(reps => ({
            ...reps,
            [exercise.exerciseid]: result.reps
          }));
          this.leaderboardsLoading.update(loading => ({
            ...loading,
            [exercise.exerciseid]: true
          }));
          this.leaderboards.update(boards => ({
            ...boards,
            [exercise.exerciseid]: []
          }));
        } else {
          this.friendsLeaderboardsReps.update(reps => ({
            ...reps,
            [exercise.exerciseid]: result.reps
          }));
          this.friendsLeaderboardsLoading.update(loading => ({
            ...loading,
            [exercise.exerciseid]: true
          }));
          this.friendsLeaderboards.update(boards => ({
            ...boards,
            [exercise.exerciseid]: []
          }));
        }
        this.getLeaderboard(exercise);
      }
    });
  }

  public openLeaderboard(exercise: Exercise) {
    const dialogRef = this.dialog.open(LeaderboardExerciseComponent, {
      width: '600px',
      data: {
        exercise: exercise,
        reps: this.leaderboardsReps()[exercise.exerciseid],
        leaderboard: this.leaderboards()[exercise.exerciseid]
      }
    });
  }

  public addExercise() {
    const dialogRef = this.dialog.open(AddExerciseComponent, {
      width: '600px',
      data: { recentExercises: this.recentExercises }
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (result && result.exercises) {
        const existingExerciseIds = Object.keys(this.leaderboards());
        const newExercises = [...this.selectedExercises()];
        const newLeaderboards = { ...this.leaderboards() };
        const newLeaderboardsLoading = { ...this.leaderboardsLoading() };
        const newLeaderboardsReps = { ...this.leaderboardsReps() };
        const newFriendsLeaderboards = { ...this.friendsLeaderboards() };
        const newFriendsLeaderboardsLoading = { ...this.friendsLeaderboardsLoading() };
        const newFriendsLeaderboardsReps = { ...this.friendsLeaderboardsReps() };

        for (let exercise of result.exercises) {
          if (existingExerciseIds.indexOf(exercise.exerciseid) < 0) {
            const addExercise = { exerciseid: exercise.exerciseid, name: exercise.name };
            newExercises.push(addExercise);

            newLeaderboardsLoading[exercise.exerciseid] = true;
            newLeaderboardsReps[exercise.exerciseid] = 1;
            newLeaderboards[exercise.exerciseid] = [];

            newFriendsLeaderboardsLoading[exercise.exerciseid] = true;
            newFriendsLeaderboardsReps[exercise.exerciseid] = 1;
            newFriendsLeaderboards[exercise.exerciseid] = [];
          }
        }

        this.selectedExercises.set(newExercises);
        this.leaderboards.set(newLeaderboards);
        this.leaderboardsLoading.set(newLeaderboardsLoading);
        this.leaderboardsReps.set(newLeaderboardsReps);
        this.friendsLeaderboards.set(newFriendsLeaderboards);
        this.friendsLeaderboardsLoading.set(newFriendsLeaderboardsLoading);
        this.friendsLeaderboardsReps.set(newFriendsLeaderboardsReps);

        await this.leaderboardService.setLeaderboardExercises(newExercises);

        for (let exercise of result.exercises) {
          await this.getLeaderboard(exercise);
        }
      }

      if (result && result.recentExercises) {
        this.recentExercises = result.recentExercises;
      }
    });
  }

  public async removeExercise(exercise: Exercise, index: number) {
    const newExercises = [...this.selectedExercises()];
    newExercises.splice(index, 1);
    this.selectedExercises.set(newExercises);

    const newLeaderboards = { ...this.leaderboards() };
    delete newLeaderboards[exercise.exerciseid];
    this.leaderboards.set(newLeaderboards);

    const newFriendsLeaderboards = { ...this.friendsLeaderboards() };
    delete newFriendsLeaderboards[exercise.exerciseid];
    this.friendsLeaderboards.set(newFriendsLeaderboards);

    await this.leaderboardService.setLeaderboardExercises(newExercises);
  }

  public async getLeaderboard(exercise: Exercise) {
    const currentTab = this.selectedTab();

    if (currentTab === 'maxes' && !this.leaderboardsLoading()[exercise.exerciseid]) {
      return;
    } else if (currentTab === 'friendsmaxes' && !this.friendsLeaderboardsLoading()[exercise.exerciseid]) {
      return;
    }

    try {
      const reps = currentTab === 'maxes' 
        ? this.leaderboardsReps()[exercise.exerciseid]
        : this.friendsLeaderboardsReps()[exercise.exerciseid];

      const leaderboardData: any = await this.leaderboardService.getLeaderboard({
        exerciseid: exercise.exerciseid,
        reps: reps,
        page: 1,
        limit: 5,
        type: currentTab
      });

      if (currentTab === 'maxes') {
        this.leaderboards.update(boards => ({
          ...boards,
          [exercise.exerciseid]: leaderboardData.data
        }));
        this.leaderboardsLoading.update(loading => ({
          ...loading,
          [exercise.exerciseid]: false
        }));
      } else if (currentTab === 'friendsmaxes') {
        this.friendsLeaderboards.update(boards => ({
          ...boards,
          [exercise.exerciseid]: leaderboardData.data
        }));
        this.friendsLeaderboardsLoading.update(loading => ({
          ...loading,
          [exercise.exerciseid]: false
        }));
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  }

  public formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString(this.translate.currentLang || 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  public onTabChange(index: number): void {
    this.selectedTab.set(index === 0 ? 'maxes' : 'friendsmaxes');
    this.tabChanged();
  }
}
