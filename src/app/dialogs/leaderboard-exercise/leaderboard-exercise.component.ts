import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DisplayInformationComponent } from '../display-information/display-information.component';

interface LeaderboardItem {
  assigneddate: string;
  created: string;
  display: string | null;
  dp: string;
  id: string;
  likes: any[];
  unit: 'lbs' | 'kg';
  userid: number;
  username: string;
  weight: string;
}

interface Exercise {
  exerciseid: string;
  name: string;
}

@Component({
  selector: 'app-leaderboard-exercise',
  templateUrl: './leaderboard-exercise.component.html',
  styleUrls: ['./leaderboard-exercise.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ]
})
export class LeaderboardExerciseComponent {
  public dialogRef = inject(MatDialogRef<LeaderboardExerciseComponent>);
  public data = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private translate = inject(TranslateService);

  public exercise: Exercise;
  public reps: number;
  public leaderboard: LeaderboardItem[];

  constructor() {
    this.exercise = this.data.exercise || {};
    this.reps = this.data.reps || 1;
    this.leaderboard = this.data.leaderboard || [];
  }

  public viewItem(exercise: Exercise, item: LeaderboardItem, rank: number): void {
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

  public formatName(item: LeaderboardItem): string {
    if (!item) return '';
    let name = item.display ? item.display : item.username;
    if (!name) return '';
    name = name.split('@')[0];
    return name;
  }

  public async share(exercise: Exercise, set: LeaderboardItem, rank: number): Promise<void> {
    const name = set.display ? set.display : set.username;
    const text = `${name} tracked ${exercise.name} for ${this.reps} reps with ${set.weight}${set.unit}. They are ranked number ${rank} on the Intensity leaderboard!`;

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

  public formatDate(date: string): string {
    const d = new Date(date);
    return d.toLocaleDateString(this.translate.currentLang || 'en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  public dismiss(): void {
    this.dialogRef.close();
  }
}
