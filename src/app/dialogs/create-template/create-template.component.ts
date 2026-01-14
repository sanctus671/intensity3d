import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { ProgramService } from '../../services/program/program.service';
import { DiaryService } from '../../services/diary/diary.service';
import { AccountService } from '../../services/account/account.service';
import { TranslationService } from '../../services/translation/translation.service';
import { PremiumComponent } from '../../pages/premium/premium.component';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ViewPremiumComponent } from '../view-premium/view-premium.component';

interface Exercise {
  exerciseid: string | number;
  name: string;
  checked: boolean;
}

interface Field {
  name: string;
  value: string;
  checked: boolean;
}

interface Option {
  name: string;
  value: string;
  checked: boolean;
}

@Component({
  selector: 'app-create-template',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatExpansionModule,
    MatDividerModule,
    TranslateModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-template.component.html',
  styleUrls: ['./create-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateTemplateComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CreateTemplateComponent>);
  private programService = inject(ProgramService);
  private diaryService = inject(DiaryService);
  private accountService = inject(AccountService);
  private translationService = inject(TranslationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  public startDate = signal<Date>(new Date());
  public endDate = signal<Date>(new Date());
  public markedWorkoutDates = signal<any[]>([]);
  public workouts = signal<any[]>([]);
  public exercises = signal<Exercise[]>([]);
  public fields = signal<Field[]>([
    { name: 'Reps', value: 'reps', checked: true },
    { name: 'Weight', value: 'weight', checked: false },
    { name: 'Percentage', value: 'percentage', checked: true },
    { name: 'RPE', value: 'rpe', checked: true },
    { name: 'Notes', value: 'notes', checked: false },
    { name: 'Rest', value: 'rest', checked: false },
    { name: 'Distance', value: 'distance', checked: false },
    { name: 'Time', value: 'time', checked: false },
  ]);
  public options = signal<Option[]>([
    { name: 'Group Similar Sets', value: 'group', checked: true },
  ]);
  public account = signal<any>({});
  private exerciseIds: any = {};
  public isLoadingExercises = signal<boolean>(true);
  public templateName = signal<string>('');
  public isGenerating = signal<boolean>(false);

  constructor() {
    // Load account data
    this.accountService.getAccountLocal().then((account: any) => {
      if (account) {
        this.account.set(account);
      }
    });
    
    // Subscribe to account updates
    this.accountService.getAccountObservable().subscribe((account: any) => {
      if (account && account.id) {
        this.account.set(account);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const account = await this.accountService.getAccount();
    if (account) {
      this.account.set(account);
    }

    this.setWeekFromDate(new Date());

    await this.getWorkouts();
    await this.setMarkedDates();
  }

  private setWeekFromDate(selected: Date): void {
    const day = selected.getDay(); // 0 = Sunday
  
    const start = new Date(selected);
    const end = new Date(selected);
  
    // Monday on/before
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
  
    // Sunday on/after
    const diffToSunday = day === 0 ? 0 : 7 - day;
    end.setDate(end.getDate() + diffToSunday);
    end.setHours(23, 59, 59, 999);
  
    this.startDate.set(start);
    this.endDate.set(end);
  }


  async setMarkedDates(): Promise<void> {
    try {
      const data: any = await this.diaryService.getDiaryData();
      const workoutDates = data['dates'];
      const formattedDates = [];
      
      for (const date of workoutDates) {
        formattedDates.push({ 
          date: date['assigneddate'], 
          backgroundColor: '#d44735' 
        });
      }
      
      this.markedWorkoutDates.set(formattedDates);
    } catch (error) {
      console.error('Error setting marked dates:', error);
    }
  }

  async getWorkouts(): Promise<void> {
    this.isLoadingExercises.set(true);
    
    const start = moment(this.startDate()).format('YYYY-MM-DD');
    const end = moment(this.endDate()).format('YYYY-MM-DD');
    
    try {
      const data: any = await this.programService.getWorkoutsForProgram(start, end);
      this.workouts.set(data || []);
      
      const exercisesList: Exercise[] = [];
      this.exerciseIds = {};
      
      for (const workout of data || []) {
        for (const set of workout.sets) {
          if (!(set.exerciseid in this.exerciseIds)) {
            exercisesList.push({ 
              exerciseid: set.exerciseid, 
              checked: true, 
              name: set.name 
            });
            this.exerciseIds[set.exerciseid] = set.name;
          }
        }
      }
      
      this.exercises.set(exercisesList);
    } catch (error) {
      console.error('Error getting workouts:', error);
    } finally {
      this.isLoadingExercises.set(false);
    }
  }

  formatDate(date: Date): string {
    return moment(date).format('MMMM Do YYYY');
  }

  getTotalDays(): number {
    const start = moment(this.startDate());
    const end = moment(this.endDate());
    const diff = end.diff(start, 'days');
    return Math.max(1, diff + 1);
  }

  
  public openPremium(): void {
    let dialogRef = this.dialog.open(ViewPremiumComponent, {
        width: '600px',
        data: {},
        autoFocus: false,
        panelClass:"premium-dialog"
    }); 
    
    dialogRef.afterClosed().subscribe(data => {
        if (data){
            this.account.set({...this.account, premium:true});
        }
    })         
} 


  public async generate(): Promise<void> {
    const currentAccount = this.account();
    
    if (!currentAccount.premium) {
      this.openPremium();
      return;
    }

    this.isGenerating.set(true);
    
    const days = this.getTotalDays();
    const currentExercises = this.exercises();
    const currentFields = this.fields();
    const currentOptions = this.options();
    const currentWorkouts = this.workouts();
    const currentTemplateName = this.templateName();
    
    // Build exercise map
    const useExercises: any = {};
    for (const exercise of currentExercises) {
      if (exercise.checked) {
        useExercises[exercise.exerciseid] = exercise.name;
      }
    }
    
    // Build fields array
    const useFields: string[] = [];
    for (const field of currentFields) {
      if (field.checked) {
        useFields.push(field.value);
      }
    }
    
    // Create program structure
    const name = currentAccount.display || currentAccount.username;
    const program = { 
      name: currentTemplateName || `${name}'s Template`, 
      public: false, 
      duration: days, 
      workouts: [] as any[]
    };
    
    // Build workouts
    for (let i = 1; i <= days; i++) {
      const workoutObj: any = {
        name: `Day ${i}`,
        day: i,
        added: true,
        exercises: [],
      };
      
      const currentDate = moment(this.startDate()).add(i - 1, 'days').format('YYYY-MM-DD');
      let currentWorkout: any[] = [];
      
      for (const workout of currentWorkouts) {
        if (workout.assigneddate === currentDate) {
          currentWorkout = workout.sets;
          break;
        }
      }
      
      // Group similar sets if option is enabled
      if (currentOptions[0].checked) {
        const grouped: any = {};
        for (const set of currentWorkout) {
          const groupKey = `${set.exerciseid}-${set.reps}-${set.percentage}`;
          if (groupKey in grouped) {
            grouped[groupKey].sets = grouped[groupKey].sets + 1;
          } else {
            set.sets = 1;
            grouped[groupKey] = { ...set };
          }
        }
        currentWorkout = Object.values(grouped);
      }
      
      // Build exercises for this workout
      for (const set of currentWorkout) {
        if (set.exerciseid in useExercises) {
          const exerciseObj: any = {
            exerciseid: set.exerciseid,
            name: useExercises[set.exerciseid],
            sets: set.sets,
          };
          
          for (const field of useFields) {
            exerciseObj[field] = set[field];
          }
          
          workoutObj.exercises.push(exerciseObj);
        }
      }
      
      program.workouts.push(workoutObj);
    }

    // Show loading message
    this.snackBar.open(
      this.translationService.instant('Creating program template...'),
      '',
      { duration: 0 }
    );
    
    try {
      const result = await this.programService.createProgram(program);
      this.programService.setProgramsObservable({ update: true });
      
      this.snackBar.dismiss();
      
      // Show success message with actions
      const confirmMessage = this.translationService.instant('Your program template has been created. You can access it from the Programs tab > My Programs.') +
        '\n\n' +
        this.translationService.instant('Would you like to view the template now?');
      
      const confirmDialogRef = this.dialog.open(ConfirmationComponent, {
        width: '400px',
        maxWidth: '95vw',
        data: {
          title: this.translationService.instant('Template Created'),
          content: confirmMessage
        }
      });
      
      confirmDialogRef.afterClosed().subscribe((confirmResult) => {
        if (confirmResult && confirmResult.confirm) {
          this.dialogRef.close({ program: result, view: true });
        } else {
          this.dialogRef.close({ program: result });
        }
      });
    } catch (error) {
      this.snackBar.dismiss();
      this.snackBar.open(
        this.translationService.instant('There was an error creating your program template. Please try again.'),
        this.translationService.instant('OK'),
        { duration: 5000 }
      );
    } finally {
      this.isGenerating.set(false);
    }
  }

  dismiss(): void {
    this.dialogRef.close();
  }

  // Date change handlers
  public onStartDateChange(date: Date | null): void {
    if (date) {
      this.startDate.set(date);
      this.getWorkouts();
    }
  }

  public onEndDateChange(date: Date | null): void {
    if (date) {
      this.endDate.set(date);
      this.getWorkouts();
    }
  }

  // Select/Deselect all exercises
  get allExercisesSelected(): boolean {
    const currentExercises = this.exercises();
    return currentExercises.length > 0 && currentExercises.every(e => e.checked);
  }

  toggleAllExercises(): void {
    const shouldSelect = !this.allExercisesSelected;
    const currentExercises = this.exercises();
    const updatedExercises = currentExercises.map(e => ({ ...e, checked: shouldSelect }));
    this.exercises.set(updatedExercises);
  }
  
  updateExerciseChecked(index: number, checked: boolean): void {
    const currentExercises = this.exercises();
    const updatedExercises = [...currentExercises];
    updatedExercises[index] = { ...updatedExercises[index], checked };
    this.exercises.set(updatedExercises);
  }
  
  updateFieldChecked(index: number, checked: boolean): void {
    const currentFields = this.fields();
    const updatedFields = [...currentFields];
    updatedFields[index] = { ...updatedFields[index], checked };
    this.fields.set(updatedFields);
  }
  
  updateOptionChecked(index: number, checked: boolean): void {
    const currentOptions = this.options();
    const updatedOptions = [...currentOptions];
    updatedOptions[index] = { ...updatedOptions[index], checked };
    this.options.set(updatedOptions);
  }
}
