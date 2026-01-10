import { Component, OnInit, ViewEncapsulation, signal, inject, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProgramService } from '../../services/program/program.service';
import { AccountService } from '../../services/account/account.service';

import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import { SelectExerciseComponent } from '../../dialogs/select-exercise/select-exercise.component';
import { CopyProgramWorkoutComponent } from '../../dialogs/copy-program-workout/copy-program-workout.component';
import { EditProgramWorkoutComponent } from '../../dialogs/edit-program-workout/edit-program-workout.component';
import { CopyProgramExerciseComponent } from '../../dialogs/copy-program-exercise/copy-program-exercise.component';
import { EditProgramExerciseComponent } from '../../dialogs/edit-program-exercise/edit-program-exercise.component';
import { ViewPremiumComponent } from '../../dialogs/view-premium/view-premium.component';
import { AutoExtendComponent } from '../../dialogs/auto-extend/auto-extend.component';

interface ProgramProperties {
    activeTab: string;
    creating: boolean;
    loading: boolean;
    isDialog?: boolean;
}

interface Workout {
    day: number;
    name: string;
    added?: boolean;
    workoutnotes?: string;
    exercises: Exercise[];
}

interface Exercise {
    exerciseid: number;
    name: string;
    sets?: string | number;
    reps?: string | number;
    maxreps?: string | number;
    percentage?: number;
    rpe?: number;
    type?: string;
    ordering?: number;
}

interface Program {
    name: string;
    description: string;
    public: boolean;
    duration: number;
    workouts: Workout[];
    id?: number;
}

@Component({
    selector: 'app-create-program',
    imports: [
        CommonModule,
        FormsModule,
        DragDropModule,
        MatDialogModule,
        MatSnackBarModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatListModule,
        MatProgressSpinnerModule,
        TranslateModule
    ],
    templateUrl: './create-program.component.html',
    styleUrls: ['./create-program.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProgramComponent implements OnInit {
    // Inputs using new input() function
    public name = input<string>();
    public id = input<number>();
    
    // Dependency injection using inject()
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private route = inject(ActivatedRoute);
    private programService = inject(ProgramService);
    private accountService = inject(AccountService);
    private router = inject(Router);
    private translate = inject(TranslateService);
    
    // Signals for reactive state management
    public properties = signal<ProgramProperties>({
        activeTab: 'Week 1',
        creating: false,
        loading: false
    });
    
    public program = signal<Program>({
        name: '',
        description: '',
        public: false,
        duration: 7,
        workouts: [{ day: 1, name: 'Day 1', added: true, exercises: [] }]
    });
    
    public tabs = signal<string[]>([]);
    public account = signal<any>({});

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
        
        this.calculateTabs();
        
        // Check if customizing an existing program (from query params)
        const customizeId = this.route.snapshot.queryParams['customize'];
        if (customizeId) {
            this.properties.update(p => ({ ...p, loading: true }));
            
            this.programService.getProgram(customizeId).then((data: any) => {
                const currentAccount = this.account();
                
                // The API might return an array with a single program object
                const programData = Array.isArray(data) ? data[0] : data;
                
                programData.name = currentAccount.username + "'s " + programData.name;
                programData.public = false;
                
                if (programData.workouts) {
                    programData.workouts.sort((a: Workout, b: Workout) => a.day - b.day);
                    
                    for (const workout of programData.workouts) {
                        workout.added = true;
                    }
                }
                
                this.program.set(programData);
                this.calculateTabs();
                this.properties.update(p => ({ ...p, loading: false }));
            }).catch((error) => {
                console.error('Error loading program to customize:', error);
                this.properties.update(p => ({ ...p, loading: false }));
            });
        }
    }
    


    ngOnInit() {  
  
    } 
    
    
    
    public openPremium(): void {
        const dialogRef = this.dialog.open(ViewPremiumComponent, {
            width: '600px',
            data: {},
            autoFocus: false,
            panelClass: 'premium-dialog'
        });
        
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                this.account.update(acc => ({ ...acc, premium: true }));
            }
        });
    }
    
    public createProgram(): void {
        const currentAccount = this.account();
        if (!currentAccount.premium) {
            this.openPremium();
            return;
        }
        
        this.properties.update(p => ({ ...p, creating: true }));
        const currentProgram = this.program();
        
        this.programService.createProgram(currentProgram).then((program: any) => {
            this.properties.update(p => ({ ...p, creating: false }));
            this.router.navigate(['/programs/' + program.id, { name: currentProgram.name }]);
        }).catch(() => {
            this.properties.update(p => ({ ...p, creating: false }));
            this.snackBar.open(this.translate.instant('Failed to create program'), '', {
                duration: 5000
            });
        });
    }
    


    public dropExercise(event: CdkDragDrop<Exercise[]>, workout: Workout): void {
        moveItemInArray(workout.exercises, event.previousIndex, event.currentIndex);
    }

    public deleteExercise(index: number, workout: Workout): void {
        workout.exercises.splice(index, 1);
    }
    
    public editExercise(exercise: Exercise): void {
        const dialogRef = this.dialog.open(EditProgramExerciseComponent, {
            width: '400px',
            data: { exercise: exercise }
        });
        
        dialogRef.afterClosed().subscribe(updatedExercise => {
            if (updatedExercise) {
                const oldExerciseId = exercise.exerciseid;
                Object.assign(exercise, updatedExercise);
                
                if (updatedExercise.switchAll) {
                    const currentProgram = this.program();
                    for (const workout of currentProgram.workouts) {
                        for (const workoutExercise of workout.exercises) {
                            if (workoutExercise.exerciseid === oldExerciseId) {
                                workoutExercise.exerciseid = updatedExercise.exerciseid;
                                workoutExercise.name = updatedExercise.name;
                            }
                        }
                    }
                    delete (exercise as any).switchAll;
                }
            }
        });
    }    
    
    public copyExercise(workout: Workout, exercise: Exercise): void {
        const dialogRef = this.dialog.open(CopyProgramExerciseComponent, {
            width: '300px',
            data: { workout: workout, exercise: exercise, program: this.program() }
        });
        
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                const currentProgram = this.program();
                for (const copyToWorkout of data) {
                    if (copyToWorkout.value) {
                        const copy = this.deepCopy(exercise);
                        currentProgram.workouts[copyToWorkout.index].exercises.push(copy);
                        
                        // Update ordering property for each exercise based on new array position
                        currentProgram.workouts[copyToWorkout.index].exercises.forEach((workoutExercise: Exercise, index: number) => {
                            workoutExercise.ordering = index;
                        });
                    }
                }
                this.program.set(currentProgram);
            }
        });
    }    
    
    public dropWorkout(event: CdkDragDrop<Workout[]>): void {
        const currentProgram = this.program();
        moveItemInArray(currentProgram.workouts, event.previousIndex, event.currentIndex);
        
        if (event.currentIndex === event.previousIndex) {
            return;
        }
        
        const weekStart = (Math.floor(currentProgram.workouts[event.previousIndex].day / 7) * 7) + 1;
        const weekEnd = weekStart + 6;
        const daysChanged = event.currentIndex - event.previousIndex;
        let newDay = currentProgram.workouts[event.currentIndex].day + daysChanged;
        const replacedDay = currentProgram.workouts[event.previousIndex].day;
        
        if ((event.currentIndex < event.previousIndex && newDay > replacedDay) || 
            (event.currentIndex > event.previousIndex && newDay < replacedDay)) {
            newDay = replacedDay;
        }
        
        if (newDay < weekStart) {
            newDay = weekStart;
        } else if (newDay > weekEnd) {
            newDay = weekEnd;
        }
        
        currentProgram.workouts[event.currentIndex].day = newDay;
        this.program.set(currentProgram);
    }    
    
    public deleteWorkout(index: number, workout: Workout): void {
        const currentProgram = this.program();
        currentProgram.workouts.splice(index, 1);
        this.program.set(currentProgram);
    }
    
    public editWorkout(workout: Workout): void {
        const dialogRef = this.dialog.open(EditProgramWorkoutComponent, {
            width: '300px',
            data: { workout: workout }
        });
        
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                workout.name = data.name;
                
                if (parseInt(data.day) && workout.day !== data.day) {
                    workout.day = data.day;
                    const currentProgram = this.program();
                    currentProgram.workouts.sort((a, b) => a.day - b.day);
                    
                    if (workout.day > currentProgram.duration) {
                        const newDuration = (Math.floor(workout.day / 7) + 1) * 7;
                        currentProgram.duration = newDuration;
                        this.program.set(currentProgram);
                        this.calculateTabs();
                    } else {
                        this.program.set(currentProgram);
                    }
                }
            }
        });
    }
    
    public copyWorkout(workout: Workout): void {
        const dialogRef = this.dialog.open(CopyProgramWorkoutComponent, {
            width: '300px',
            data: { workout: workout, program: this.program() }
        });
        
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                const currentProgram = this.program();
                const exerciseCount = workout.exercises.length;
                
                for (const copyToWorkout of data) {
                    if (copyToWorkout.value) {
                        for (let x = 0; x < exerciseCount; x++) {
                            const exercise = workout.exercises[x];
                            const copy = this.deepCopy(exercise);
                            currentProgram.workouts[copyToWorkout.index].exercises.push(copy);
                        }
                    }
                }
                this.program.set(currentProgram);
            }
        });
    }
    
    public dropTab(event: CdkDragDrop<string[]>): void {
        const currentTabs = this.tabs();
        moveItemInArray(currentTabs, event.previousIndex, event.currentIndex);
        
        if (event.currentIndex === event.previousIndex) {
            return;
        }
        
        const daysChange = (event.currentIndex - event.previousIndex) * 7;
        const moveWeekStartDay = (event.previousIndex * 7) + 1;
        const moveWeekEndDay = moveWeekStartDay + 6;
        const newWeekStartDay = moveWeekStartDay + daysChange;
        const newWeekEndDay = moveWeekEndDay + daysChange;
        
        const currentProgram = this.program();
        for (const workout of currentProgram.workouts) {
            workout.day = parseInt(workout.day.toString());
            
            if (workout.day >= moveWeekStartDay && workout.day <= moveWeekEndDay) {
                workout.day += daysChange;
            } else if (daysChange > 0 && (workout.day >= moveWeekStartDay && workout.day <= newWeekEndDay)) {
                workout.day -= 7;
            } else if (daysChange < 0 && (workout.day >= newWeekStartDay && workout.day <= moveWeekEndDay)) {
                workout.day += 7;
            }
        }
        
        for (let index = 0; index < currentTabs.length; index++) {
            currentTabs[index] = 'Week ' + (index + 1);
        }
        
        this.tabs.set(currentTabs);
        this.program.set(currentProgram);
        this.properties.update(p => ({ ...p, activeTab: 'Week ' + (event.currentIndex + 1) }));
    }
    
    public copyTab(week: string, index: number): void {
        this.addWeek();
        const currentTabs = this.tabs();
        const newWeekStartDay = (currentTabs.length * 7) - 7;
        const copyWeekStartDay = (index * 7) + 1;
        const copyWeekEndDay = copyWeekStartDay + 6;
        
        const currentProgram = this.program();
        for (const workout of currentProgram.workouts) {
            if (workout.day >= copyWeekStartDay && workout.day <= copyWeekEndDay) {
                const copy = this.deepCopy(workout);
                copy.day -= (copyWeekStartDay - 1);
                copy.day += newWeekStartDay;
                copy.name = 'Day ' + copy.day;
                currentProgram.workouts.push(copy);
            }
        }
        this.program.set(currentProgram);
    }
    
    public removeTab(week: string, index: number): void {
        const weekStartDay = (index * 7) + 1;
        const weekEndDay = weekStartDay + 6;
        const currentProgram = this.program();
        
        for (let x = currentProgram.workouts.length - 1; x >= 0; x--) {
            const workout = currentProgram.workouts[x];
            if (workout.day >= weekStartDay && workout.day <= weekEndDay) {
                currentProgram.workouts.splice(x, 1);
            } else if (workout.day > weekEndDay) {
                workout.day -= 7;
            }
        }
        
        currentProgram.duration -= 7;
        
        if (currentProgram.duration < 7) {
            currentProgram.duration = 7;
            currentProgram.workouts = [{ day: 1, name: 'Day 1', exercises: [] }];
        }
        
        this.program.set(currentProgram);
        this.calculateTabs();
        
        let weekNumber = parseInt(week.split(' ')[1]) - 1;
        weekNumber = weekNumber ? weekNumber : 1;
        this.properties.update(p => ({ ...p, activeTab: 'Week ' + weekNumber }));
    }
    
    private calculateTabs(): void {
        const currentProgram = this.program();
        const tabsCount = Math.ceil(currentProgram.duration / 7);
        const newTabs: string[] = [];
        
        for (let x = 1; x <= tabsCount; x++) {
            newTabs.push('Week ' + x);
        }
        this.tabs.set(newTabs);
    }
    
    public isInTab(workout: Workout): boolean {
        const currentTabs = this.tabs();
        const currentProperties = this.properties();
        const index = currentTabs.indexOf(currentProperties.activeTab) + 1;
        const tab = Math.ceil(workout.day / 7);
        
        return index === tab;
    }
    
    public formatExerciseType(setType: string): string {
        const types: { [key: string]: string } = {
            amrap: 'AMRAP',
            ss: 'Super Set',
            ds: 'Drop Set',
            bs: 'Backoff Set',
            w: 'Warmup',
            c: 'Circuit'
        };
        
        return types[setType] || '';
    }
    
    public setActiveTab(tab: string): void {
        this.properties.update(p => ({ ...p, activeTab: tab }));
    }
    
    public addWeek(): void {
        const currentProgram = this.program();
        currentProgram.duration = currentProgram.duration + 7;
        this.program.set(currentProgram);
        this.calculateTabs();
    }
    
    public openAutoExtend(): void {
        const dialogRef = this.dialog.open(AutoExtendComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: { program: this.program() }
        });
        
        dialogRef.afterClosed().subscribe(data => {
            if (data?.options) {
                this.autoExtendProgram(data.options);
            }
        });
    }
    
    private autoExtendProgram(options: any): void {
        const numberOfWeeks = options.numberOfWeeks;
        const currentProgram = this.program();
        const currentWeeks = Math.ceil(currentProgram.duration / 7);
        
        // Add the specified number of weeks and copy exercises with progression
        for (let week = 1; week <= numberOfWeeks; week++) {
            this.addWeek();
            const sourceWeek = currentWeeks + week - 1;
            const targetWeek = currentWeeks + week;
            this.copyWeekWithProgression(sourceWeek, targetWeek, options);
        }
    }
    
    private copyWeekWithProgression(sourceWeek: number, targetWeek: number, options: any): void {
        const progressionTypes = options.progressionTypes;
        const progressionFrequency = options.progressionFrequency;
        const progressionTimeframe = options.progressionTimeframe;
        const progressionExercises = options.progressionExercises;
        const currentProgram = this.program();
        
        // Check if progression should be applied this week
        let shouldApplyProgression = false;
        if (progressionFrequency === 'every') {
            shouldApplyProgression = true;
        } else if (progressionFrequency === 'everyX') {
            const originalWeekCount = Math.ceil(currentProgram.duration / 7) - options.numberOfWeeks;
            const weekOffset = targetWeek - originalWeekCount;
            shouldApplyProgression = (weekOffset % progressionTimeframe === 0);
        }
        
        // Get source week range
        const sourceWeekStartDay = (sourceWeek - 1) * 7 + 1;
        const sourceWeekEndDay = sourceWeekStartDay + 6;
        
        // Get target week range
        const targetWeekStartDay = (targetWeek - 1) * 7 + 1;
        
        // Copy workouts from source week to target week
        for (const workout of currentProgram.workouts) {
            if (workout.day >= sourceWeekStartDay && workout.day <= sourceWeekEndDay) {
                const copy = this.deepCopy(workout);
                
                // Adjust day for target week
                copy.day = copy.day - sourceWeekStartDay + targetWeekStartDay;
                copy.name = 'Day ' + copy.day;
                
                // Apply progression to exercises if needed
                if (shouldApplyProgression) {
                    for (const exercise of copy.exercises) {
                        const exerciseProgression = progressionExercises[exercise.exerciseid];
                        
                        // Determine which progression settings to use
                        let progressionTypesToUse = progressionTypes;
                        
                        // If exercise has custom settings enabled, use those instead
                        if (exerciseProgression?.enabled) {
                            progressionTypesToUse = exerciseProgression.progressionTypes;
                        }
                        
                        // Apply percentage progression
                        if (progressionTypesToUse.percentage?.enabled && exercise.percentage) {
                            const amount = progressionTypesToUse.percentage.amount;
                            exercise.percentage = Math.min(100, parseFloat(exercise.percentage.toString()) + amount);
                        }
                        
                        // Apply RPE progression
                        if (progressionTypesToUse.rpe?.enabled && exercise.rpe) {
                            const amount = progressionTypesToUse.rpe.amount;
                            exercise.rpe = Math.min(10, parseFloat(exercise.rpe.toString()) + amount);
                        }
                        
                        // Apply reps progression
                        if (progressionTypesToUse.reps?.enabled) {
                            if (!exercise.reps) exercise.reps = 0;
                            const amount = progressionTypesToUse.reps.amount;
                            exercise.reps = Math.max(1, parseInt(exercise.reps.toString()) + Math.round(amount));
                            
                            if (exercise.maxreps) {
                                exercise.maxreps = Math.max(1, parseInt(exercise.maxreps.toString()) + Math.round(amount));
                            }
                        }
                        
                        // Apply sets progression
                        if (progressionTypesToUse.sets?.enabled) {
                            if (!exercise.sets) exercise.sets = 0;
                            const amount = progressionTypesToUse.sets.amount;
                            exercise.sets = Math.max(1, parseInt(exercise.sets.toString()) + Math.round(amount));
                        }
                    }
                }
                
                currentProgram.workouts.push(copy);
            }
        }
        
        this.program.set(currentProgram);
    } 
    
    public scrollToBottom(): void {
        setTimeout(() => {
            const objDiv = document.getElementById('program-workouts');
            if (objDiv) {
                objDiv.scrollTop = objDiv.scrollHeight;
            }
        }, 100);
    }
    
    public addWorkout(): void {
        const currentTabs = this.tabs();
        const currentProperties = this.properties();
        const currentProgram = this.program();
        
        const weekIndex = currentTabs.indexOf(currentProperties.activeTab);
        const weekStartDay = (weekIndex * 7) + 1;
        const weekEndDay = weekStartDay + 6;
        let newDay = weekStartDay;
        
        for (const workout of currentProgram.workouts) {
            if (workout.day >= weekStartDay && workout.day <= weekEndDay) {
                newDay = workout.day + 1;
            }
        }
        
        if (newDay > weekEndDay) {
            newDay = weekEndDay;
        }
        
        currentProgram.workouts.push({ name: 'Day ' + newDay, day: newDay, added: true, exercises: [] });
        this.program.set(currentProgram);
        this.scrollToBottom();
    }
    
    public addExercise(workout: Workout): void {
        const dialogRef = this.dialog.open(SelectExerciseComponent, {
            width: '600px',
            data: {}
        });
        
        dialogRef.afterClosed().subscribe(exercise => {
            if (exercise) {
                exercise.type = '';
                workout.exercises.push(exercise);
                workout.exercises.forEach((ex: Exercise, index: number) => {
                    ex.ordering = index;
                });
            }
        });
    }
    
    private deepCopy<T>(oldObj: T): T {
        let newObj: any = oldObj;
        if (oldObj && typeof oldObj === 'object') {
            newObj = Object.prototype.toString.call(oldObj) === '[object Array]' ? [] : {};
            for (const i in oldObj) {
                newObj[i] = this.deepCopy(oldObj[i]);
            }
        }
        return newObj;
    }     

}
