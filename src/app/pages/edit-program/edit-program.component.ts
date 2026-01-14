import { Component, OnInit, ViewEncapsulation, signal, inject, ChangeDetectionStrategy } from '@angular/core';
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
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ProgramService } from '../../services/program/program.service';
import { AccountService } from '../../services/account/account.service';

import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';
import { AddExerciseComponent } from '../../dialogs/add-exercise/add-exercise.component';
import { CopyProgramWorkoutComponent } from '../../dialogs/copy-program-workout/copy-program-workout.component';
import { EditProgramWorkoutComponent } from '../../dialogs/edit-program-workout/edit-program-workout.component';
import { CopyProgramExerciseComponent } from '../../dialogs/copy-program-exercise/copy-program-exercise.component';
import { EditProgramExerciseComponent } from '../../dialogs/edit-program-exercise/edit-program-exercise.component';
import { AutoExtendComponent } from '../../dialogs/auto-extend/auto-extend.component';

interface ProgramProperties {
    activeTab: string;
    updating: boolean;
    loading: boolean;
    deleting: boolean;
    isDialog?: boolean;
}

interface Workout {
    day: number;
    name: string;
    added?: boolean;
    workoutnotes?: string;
    exercises: Exercise[];
    workoutid?: number | null;
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
    id?: number | null;
}

interface Program {
    name: string;
    description: string;
    public: boolean | number;
    duration: number;
    workouts: Workout[];
    id?: number;
}

@Component({
    selector: 'app-edit-program',
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
        MatBadgeModule,
        MatButtonToggleModule,
        TranslateModule
    ],
    templateUrl: './edit-program.component.html',
    styleUrls: ['./edit-program.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditProgramComponent implements OnInit {
    
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
        updating: false,
        loading: false,
        deleting: false
    });
    
    public program = signal<Program>({
        name: '',
        description: '',
        public: false,
        duration: 7,
        workouts: []
    });
    
    public tabs = signal<string[]>([]);
    public account = signal<any>({});
    public workoutNotesVisible = signal<Set<number>>(new Set());
    public displayMode = signal<'stacked' | 'grid'>('stacked');

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
        
        // Load program if id is in route
        const programId = this.route.snapshot.params['id'];
        if (programId) {
            this.properties.update(p => ({ ...p, loading: true }));
            
            this.programService.getProgram(programId).then((data: any) => {
                // The API might return an array with a single program object
                const programData = Array.isArray(data) ? data[0] : data;
                
                programData.public = parseInt(programData.public) || 0;
                programData.duration = parseInt(programData.duration) || 7;
                
                if (programData.workouts) {
                    // Ensure workout.day is a number (API may return strings)
                    programData.workouts = programData.workouts.map((w: Workout) => ({
                        ...w,
                        day: parseInt(w.day.toString(), 10)
                    }));
                    programData.workouts.sort((a: Workout, b: Workout) => a.day - b.day);
                } else {
                    programData.workouts = [];
                }
                
                this.program.set(programData);
                this.calculateTabs();
                this.properties.update(p => ({ ...p, loading: false }));
            }).catch((error) => {
                console.error('Error loading program to edit:', error);
                this.properties.update(p => ({ ...p, loading: false }));
            });
        }
    }
    


    ngOnInit() {  
  
    } 
    
    public deleteProgram(): void {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '300px',
            data: { 
                title: this.translate.instant('Delete Program'), 
                content: this.translate.instant('Are you sure you want to delete this program?') 
            }
        });
        
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                this.properties.update(p => ({ ...p, deleting: true }));
                const currentProgram = this.program();
                
                this.programService.deleteProgram(currentProgram.id!).then(() => {
                    this.properties.update(p => ({ ...p, deleting: false }));
                    this.dialog.open(DisplayInformationComponent, {
                        width: '300px',
                        data: { 
                            title: this.translate.instant('Program Deleted'), 
                            content: this.translate.instant('This program has now been removed') 
                        }
                    });
                    this.router.navigate(['/programs']);
                }).catch(() => {
                    this.properties.update(p => ({ ...p, deleting: false }));
                    this.snackBar.open(this.translate.instant('Failed to delete program'), '', {
                        duration: 5000
                    });
                });
            }
        });
    }
    
    public updateProgram(): void {
        this.properties.update(p => ({ ...p, updating: true }));
        const currentProgram = this.program();
        
        this.programService.updateProgram(currentProgram.id!, currentProgram).then((program: any) => {
            this.properties.update(p => ({ ...p, updating: false }));
            this.router.navigate(['/programs/' + currentProgram.id, { name: currentProgram.name }]);
        }).catch(() => {
            this.properties.update(p => ({ ...p, updating: false }));
            this.snackBar.open(this.translate.instant('Failed to update program'), '', {
                duration: 5000
            });
        });
    }
    


    public dropExercise(event: CdkDragDrop<Exercise[]>, workout: Workout): void {
        this.program.update(currentProgram => {
            const newExercises = [...workout.exercises];
            moveItemInArray(newExercises, event.previousIndex, event.currentIndex);
            
            return {
                ...currentProgram,
                workouts: currentProgram.workouts.map(w => 
                    w === workout 
                        ? { ...w, exercises: newExercises.map((ex, idx) => ({ ...ex, ordering: idx })) }
                        : w
                )
            };
        });
    }

    public deleteExercise(index: number, workout: Workout): void {
        this.program.update(currentProgram => ({
            ...currentProgram,
            workouts: currentProgram.workouts.map(w => 
                w === workout 
                    ? { ...w, exercises: w.exercises.filter((_, i) => i !== index) }
                    : w
            )
        }));
    }
    
    public editExercise(exercise: Exercise): void {
        const dialogRef = this.dialog.open(EditProgramExerciseComponent, {
            width: '400px',
            data: { exercise: exercise }
        });
        
        dialogRef.afterClosed().subscribe(updatedExercise => {
            if (updatedExercise) {
                const oldExerciseId = exercise.exerciseid;
                const switchAll = updatedExercise.switchAll;
                delete updatedExercise.switchAll;
                
                this.program.update(currentProgram => ({
                    ...currentProgram,
                    workouts: currentProgram.workouts.map(workout => ({
                        ...workout,
                        exercises: workout.exercises.map(ex => {
                            if (ex === exercise || (switchAll && ex.exerciseid === oldExerciseId)) {
                                return { ...ex, ...updatedExercise };
                            }
                            return ex;
                        })
                    }))
                }));
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
                this.program.update(currentProgram => ({
                    ...currentProgram,
                    workouts: currentProgram.workouts.map((w, index) => {
                        const copyToWorkout = data.find((ctw: any) => ctw.index === index);
                        if (copyToWorkout?.value) {
                            const copy = this.deepCopy(exercise);
                            copy.id = null;
                            const newExercises = [...w.exercises, copy];
                            return { 
                                ...w, 
                                exercises: newExercises.map((ex, idx) => ({ ...ex, ordering: idx }))
                            };
                        }
                        return w;
                    })
                }));
            }
        });
    }    
    
    public dropWorkout(event: CdkDragDrop<Workout[]>): void {
        if (event.currentIndex === event.previousIndex) {
            return;
        }
        
        const currentProgram = this.program();
        const workoutsInTab = this.getWorkoutsInTab();
        
        // Get the actual workout being moved and the target workout
        const movedWorkout = workoutsInTab[event.previousIndex];
        const targetWorkout = workoutsInTab[event.currentIndex];
        
        if (!movedWorkout || !targetWorkout) {
            return;
        }
        
        // Find actual indices in the full workouts array
        const actualPreviousIndex = currentProgram.workouts.indexOf(movedWorkout);
        const actualCurrentIndex = currentProgram.workouts.indexOf(targetWorkout);
        
        if (actualPreviousIndex === -1 || actualCurrentIndex === -1) {
            return;
        }
        
        // Calculate new day based on position in the week
        const currentTabs = this.tabs();
        const currentProperties = this.properties();
        const weekIndex = currentTabs.indexOf(currentProperties.activeTab);
        const weekStart = (weekIndex * 7) + 1;
        const weekEnd = weekStart + 6;
        
        // Create a temporary reordered array to calculate the new day
        const reorderedWorkouts = [...workoutsInTab];
        moveItemInArray(reorderedWorkouts, event.previousIndex, event.currentIndex);
        
        // Calculate the new day based on the reordered array
        const newDay = this.calculateNewDayForWorkout(reorderedWorkouts, event.currentIndex, weekStart, weekEnd);
        
        // Update the name if it follows the "Day X" pattern
        const regex = /^Day \d+$/;
        const updatedName = regex.test(movedWorkout.name) ? "Day " + newDay : movedWorkout.name;
        
        this.program.update(prog => {
            const newWorkouts = [...prog.workouts];
            moveItemInArray(newWorkouts, actualPreviousIndex, actualCurrentIndex);
            
            // Update the moved workout with new day and name
            return {
                ...prog,
                workouts: newWorkouts.map(w => 
                    w === movedWorkout 
                        ? { ...w, day: newDay, name: updatedName }
                        : w
                )
            };
        });
    }
    
    private calculateNewDayForWorkout(workoutsInTab: Workout[], position: number, weekStart: number, weekEnd: number): number {
        // Get the items before and after the current position
        const itemBefore = position > 0 ? workoutsInTab[position - 1] : null;
        const itemAfter = position < workoutsInTab.length - 1 ? workoutsInTab[position + 1] : null;
        
        // Case 1: First position in the week
        if (!itemBefore) {
            return weekStart;
        }
        
        // Case 2: Item before exists
        if (itemBefore) {
            const beforeDay = parseInt(itemBefore.day.toString(), 10);
            
            // Case 2a: Last position in the week (no item after)
            if (!itemAfter) {
                return Math.min(beforeDay + 1, weekEnd);
            }
            
            // Case 2b: Item after also exists
            if (itemAfter) {
                const afterDay = parseInt(itemAfter.day.toString(), 10);
                
                // If there's space between the workouts, place it between them
                if (afterDay > beforeDay + 1) {
                    return beforeDay + 1;
                } else {
                    return Math.min(beforeDay, weekEnd);
                }
            }
        }
        
        // Fallback: place at the start of the week
        return weekStart;
    }    
    
    public confirmDeleteWorkout(index: number, workout: Workout): void {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '400px',
            data: {
                title: this.translate.instant('Confirm Delete'),
                content: this.translate.instant('Are you sure you want to delete this workout? All exercises in this workout will be removed.')
            }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            if (result?.confirm) {
                this.deleteWorkout(index, workout);
            }
        });
    }
    
    public deleteWorkout(index: number, workout: Workout): void {
        this.program.update(currentProgram => ({
            ...currentProgram,
            workouts: currentProgram.workouts.filter((_, i) => i !== index)
        }));
    }
    
    public confirmDeleteWorkoutByRef(workout: Workout): void {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '400px',
            data: {
                title: this.translate.instant('Confirm Delete'),
                content: this.translate.instant('Are you sure you want to delete this workout? All exercises in this workout will be removed.')
            }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            if (result?.confirm) {
                this.deleteWorkoutByRef(workout);
            }
        });
    }
    
    public deleteWorkoutByRef(workout: Workout): void {
        this.program.update(currentProgram => ({
            ...currentProgram,
            workouts: currentProgram.workouts.filter(w => w !== workout)
        }));
    }
    
    public editWorkout(workout: Workout): void {
        const dialogRef = this.dialog.open(EditProgramWorkoutComponent, {
            width: '300px',
            data: { workout: workout }
        });
        
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                const newDay = parseInt(data.day, 10);
                const currentDay = parseInt(workout.day.toString(), 10);
                const dayChanged = newDay && currentDay !== newDay;
                
                // Update the name if it follows the "Day X" pattern and day changed
                const regex = /^Day \d+$/;
                const updatedName = (dayChanged && regex.test(workout.name)) ? "Day " + newDay : data.name;
                
                this.program.update(currentProgram => {
                    let updatedWorkouts = currentProgram.workouts.map(w => 
                        w === workout 
                            ? { ...w, name: updatedName, day: dayChanged ? newDay : parseInt(w.day.toString(), 10) }
                            : w
                    );
                    
                    // Sort workouts by day
                    updatedWorkouts = [...updatedWorkouts].sort((a, b) => 
                        parseInt(a.day.toString(), 10) - parseInt(b.day.toString(), 10)
                    );
                    
                    // Check if duration needs to be updated
                    let newDuration = currentProgram.duration;
                    if (dayChanged && newDay > currentProgram.duration) {
                        newDuration = (Math.floor(newDay / 7) + 1) * 7;
                    }
                    
                    return {
                        ...currentProgram,
                        workouts: updatedWorkouts,
                        duration: newDuration
                    };
                });
                
                if (dayChanged) {
                    this.calculateTabs();
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
                this.program.update(currentProgram => ({
                    ...currentProgram,
                    workouts: currentProgram.workouts.map((w, index) => {
                        const copyToWorkout = data.find((ctw: any) => ctw.index === index);
                        if (copyToWorkout?.value) {
                            const copiedExercises = workout.exercises.map(ex => {
                                const copy = this.deepCopy(ex);
                                copy.id = null;
                                return copy;
                            });
                            return { ...w, exercises: [...w.exercises, ...copiedExercises] };
                        }
                        return w;
                    })
                }));
            }
        });
    }
    
    public dropTab(event: CdkDragDrop<string[]>): void {
        if (event.currentIndex === event.previousIndex) {
            return;
        }
        
        const daysChange = (event.currentIndex - event.previousIndex) * 7;
        const moveWeekStartDay = (event.previousIndex * 7) + 1;
        const moveWeekEndDay = moveWeekStartDay + 6;
        const newWeekStartDay = moveWeekStartDay + daysChange;
        const newWeekEndDay = moveWeekEndDay + daysChange;
        
        // Update tabs
        const currentTabs = [...this.tabs()];
        moveItemInArray(currentTabs, event.previousIndex, event.currentIndex);
        const updatedTabs = currentTabs.map((_, index) => 'Week ' + (index + 1));
        this.tabs.set(updatedTabs);
        
        // Update program with new workout days
        this.program.update(currentProgram => ({
            ...currentProgram,
            workouts: currentProgram.workouts.map(workout => {
                const day = parseInt(workout.day.toString());
                let newDay = day;
                
                if (day >= moveWeekStartDay && day <= moveWeekEndDay) {
                    newDay = day + daysChange;
                } else if (daysChange > 0 && (day >= moveWeekStartDay && day <= newWeekEndDay)) {
                    newDay = day - 7;
                } else if (daysChange < 0 && (day >= newWeekStartDay && day <= moveWeekEndDay)) {
                    newDay = day + 7;
                }
                
                if (newDay !== day) {
                    const regex = /^Day \d+$/;
                    const updatedWorkout: any = { ...workout, day: newDay };
                    if (regex.test(workout.name)) {
                        updatedWorkout.name = "Day " + newDay;
                    }
                    return updatedWorkout;
                }
                return workout;
            })
        }));
        
        this.properties.update(p => ({ ...p, activeTab: 'Week ' + (event.currentIndex + 1) }));
    }
    
    public copyTab(week: string, index: number): void {
        this.addWeek();
        const currentTabs = this.tabs();
        const newWeekStartDay = (currentTabs.length * 7) - 7;
        const copyWeekStartDay = (index * 7) + 1;
        const copyWeekEndDay = copyWeekStartDay + 6;
        
        this.program.update(currentProgram => {
            const newWorkouts: Workout[] = [];
            
            for (const workout of currentProgram.workouts) {
                const workoutDay = parseInt(workout.day.toString(), 10);
                if (workoutDay >= copyWeekStartDay && workoutDay <= copyWeekEndDay) {
                    const copy = this.deepCopy(workout);
                    copy.day = workoutDay - (copyWeekStartDay - 1) + newWeekStartDay;
                    copy.name = 'Day ' + copy.day;
                    copy.workoutid = null;
                    copy.added = true;
                    newWorkouts.push(copy);
                }
            }
            
            return {
                ...currentProgram,
                workouts: [...currentProgram.workouts, ...newWorkouts]
            };
        });
    }
    
    public confirmRemoveTab(week: string, index: number): void {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '400px',
            data: {
                title: this.translate.instant('Confirm Delete'),
                content: this.translate.instant('Are you sure you want to delete this week? All workouts in this week will be removed.')
            }
        });
        
        dialogRef.afterClosed().subscribe(result => {
            if (result?.confirm) {
                this.removeTab(week, index);
            }
        });
    }
    
    public removeTab(week: string, index: number): void {
        const weekStartDay = (index * 7) + 1;
        const weekEndDay = weekStartDay + 6;
        
        this.program.update(currentProgram => {
            const filteredWorkouts = currentProgram.workouts
                .filter(workout => {
                    const day = parseInt(workout.day.toString(), 10);
                    return day < weekStartDay || day > weekEndDay;
                })
                .map(workout => {
                    const day = parseInt(workout.day.toString(), 10);
                    return day > weekEndDay 
                        ? { ...workout, day: day - 7 }
                        : workout;
                });
            
            const newDuration = currentProgram.duration - 7;
            
            if (newDuration < 7) {
                return {
                    ...currentProgram,
                    duration: 7,
                    workouts: [{ day: 1, name: 'Day 1', exercises: [] }]
                };
            }
            
            return {
                ...currentProgram,
                duration: newDuration,
                workouts: filteredWorkouts
            };
        });
        
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
        const day = parseInt(workout.day.toString(), 10);
        const tab = Math.ceil(day / 7);
        
        return index === tab;
    }
    
    public getWorkoutsInTab(): Workout[] {
        return this.program().workouts.filter(workout => this.isInTab(workout));
    }
    
    public setDisplayMode(mode: 'stacked' | 'grid'): void {
        this.displayMode.set(mode);
    }
    
    public getGridData(): { weeks: string[], days: string[], workoutsByWeekAndDay: Map<string, Workout | null> } {
        const weeks = this.tabs();
        const daysOfWeek = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
        const workoutsByWeekAndDay = new Map<string, Workout | null>();
        
        // Initialize all cells as null
        weeks.forEach((week, weekIndex) => {
            daysOfWeek.forEach((_, dayIndex) => {
                const key = `${weekIndex}-${dayIndex}`;
                workoutsByWeekAndDay.set(key, null);
            });
        });
        
        // Fill in workouts
        const currentProgram = this.program();
        currentProgram.workouts.forEach(workout => {
            const day = parseInt(workout.day.toString(), 10);
            const weekIndex = Math.ceil(day / 7) - 1;
            const dayIndex = ((day - 1) % 7);
            const key = `${weekIndex}-${dayIndex}`;
            workoutsByWeekAndDay.set(key, workout);
        });
        
        return { weeks, days: daysOfWeek, workoutsByWeekAndDay };
    }
    
    public getWorkoutForCell(weekIndex: number, dayIndex: number): Workout | null {
        const gridData = this.getGridData();
        const key = `${weekIndex}-${dayIndex}`;
        return gridData.workoutsByWeekAndDay.get(key) || null;
    }
    
    public getWorkoutsForDayInWeek(weekIndex: number, dayIndex: number): Workout[] {
        const currentProgram = this.program();
        const dayNumber = (weekIndex * 7) + dayIndex + 1;
        return currentProgram.workouts.filter(workout => parseInt(workout.day.toString(), 10) === dayNumber);
    }
    
    public dropWorkoutInGrid(event: CdkDragDrop<{ weekIndex: number; dayIndex: number }>, targetWeekIndex: number, targetDayIndex: number): void {
        const workout = event.item.data as Workout;
        
        if (!workout) {
            return;
        }
        
        // Calculate the new day based on target cell
        const newDay = (targetWeekIndex * 7) + targetDayIndex + 1;
        const currentDay = parseInt(workout.day.toString(), 10);
        
        // Check if workout is moving to a different day
        if (currentDay === newDay) {
            return;
        }
        
        // Update workout day
        const regex = /^Day \d+$/;
        const updatedName = regex.test(workout.name) ? "Day " + newDay : workout.name;
        
        this.program.update(currentProgram => ({
            ...currentProgram,
            workouts: currentProgram.workouts.map(w => 
                w === workout 
                    ? { ...w, day: newDay, name: updatedName }
                    : w
            )
        }));
    }
    
    public addWorkoutToCell(weekIndex: number, dayIndex: number): void {
        const newDay = (weekIndex * 7) + dayIndex + 1;
        
        this.program.update(prog => ({
            ...prog,
            workouts: [...prog.workouts, { name: 'Day ' + newDay, day: newDay, added: true, exercises: [] }]
        }));
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
        this.program.update(currentProgram => ({
            ...currentProgram,
            duration: currentProgram.duration + 7
        }));
        this.calculateTabs();
        
        // Scroll grid container to the right to show newly added week
        if (this.displayMode() === 'grid') {
            this.scrollGridToEnd();
        }
    }
    
    private scrollGridToEnd(): void {
        setTimeout(() => {
            const gridContainer = document.querySelector('.edit-program__grid-container');
            if (gridContainer) {
                gridContainer.scrollTo({
                    left: gridContainer.scrollWidth,
                    behavior: 'smooth'
                });
            }
        }, 100);
    }
    
    public updateProgramName(name: string): void {
        this.program.update(p => ({ ...p, name }));
    }
    
    public updateProgramDescription(description: string): void {
        this.program.update(p => ({ ...p, description }));
    }
    
    public updateProgramPublic(isPublic: boolean | number): void {
        this.program.update(p => ({ ...p, public: isPublic }));
    }
    
    public updateWorkoutNotes(workout: Workout, notes: string): void {
        this.program.update(currentProgram => ({
            ...currentProgram,
            workouts: currentProgram.workouts.map(w => 
                w === workout 
                    ? { ...w, workoutnotes: notes }
                    : w
            )
        }));
    }
    
    public toggleWorkoutNotes(workout: Workout): void {
        const currentVisible = this.workoutNotesVisible();
        const newVisible = new Set(currentVisible);
        
        if (newVisible.has(workout.day)) {
            newVisible.delete(workout.day);
        } else {
            newVisible.add(workout.day);
        }
        
        this.workoutNotesVisible.set(newVisible);
    }
    
    public isWorkoutNotesVisible(workout: Workout): boolean {
        // Show notes if explicitly toggled visible or if workout has notes content
        return this.workoutNotesVisible().has(workout.day);
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
        
        // Create new workouts for the target week
        const newWorkouts: Workout[] = [];
        
        // Copy workouts from source week to target week
        for (const workout of currentProgram.workouts) {
            const workoutDay = parseInt(workout.day.toString(), 10);
            if (workoutDay >= sourceWeekStartDay && workoutDay <= sourceWeekEndDay) {
                const copy = this.deepCopy(workout);
                
                // Adjust day for target week
                copy.day = workoutDay - sourceWeekStartDay + targetWeekStartDay;
                copy.name = 'Day ' + copy.day;
                copy.workoutid = null;
                copy.added = true;
                
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
                        
                        // Clear ID for new exercises
                        if (exercise.id) {
                            exercise.id = null;
                        }
                    }
                }
                
                newWorkouts.push(copy);
            }
        }
        
        this.program.update(prog => ({
            ...prog,
            workouts: [...prog.workouts, ...newWorkouts]
        }));
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
            const day = parseInt(workout.day.toString(), 10);
            if (day >= weekStartDay && day <= weekEndDay) {
                newDay = day + 1;
            }
        }
        
        if (newDay > weekEndDay) {
            newDay = weekEndDay;
        }
        
        this.program.update(prog => ({
            ...prog,
            workouts: [...prog.workouts, { name: 'Day ' + newDay, day: newDay, added: true, exercises: [] }]
        }));
        this.scrollToBottom();
    }
    
    public addExercise(workout: Workout): void {
        const dialogRef = this.dialog.open(AddExerciseComponent, {
            width: '600px',
            data: {}
        });
        
        dialogRef.afterClosed().subscribe(result => {
            if (result && result.exercises && result.exercises.length > 0) {
                this.program.update(currentProgram => ({
                    ...currentProgram,
                    workouts: currentProgram.workouts.map(w => {
                        if (w === workout) {
                            const newExercises = [
                                ...w.exercises,
                                ...result.exercises.map((ex: any) => ({
                                    ...ex,
                                    type: '',
                                    sets: 1
                                }))
                            ];
                            // Update ordering for all exercises
                            return { 
                                ...w, 
                                exercises: newExercises.map((ex, idx) => ({ ...ex, ordering: idx }))
                            };
                        }
                        return w;
                    })
                }));
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
