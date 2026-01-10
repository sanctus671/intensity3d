import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface ProgressionType {
    enabled: boolean;
    amount: number;
}

interface ProgressionTypes {
    percentage: ProgressionType;
    rpe: ProgressionType;
    reps: ProgressionType;
    sets: ProgressionType;
}

interface ExerciseProgressionSettings {
    enabled: boolean;
    progressionTypes: ProgressionTypes;
}

interface AutoExtendOptions {
    numberOfWeeks: number;
    progressionTypes: ProgressionTypes;
    progressionFrequency: 'every' | 'everyX';
    progressionTimeframe: number;
    progressionExercises: { [key: number]: ExerciseProgressionSettings };
}

interface Exercise {
    exerciseid: number;
    name: string;
    enabled?: boolean;
}

@Component({
    selector: 'app-auto-extend',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatSelectModule,
        MatSnackBarModule,
        MatExpansionModule,
        TranslateModule
    ],
    templateUrl: './auto-extend.component.html',
    styleUrls: ['./auto-extend.component.scss']
})
export class AutoExtendComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<AutoExtendComponent>);
    private data = inject(MAT_DIALOG_DATA);
    private translate = inject(TranslateService);
    private snackBar = inject(MatSnackBar);

    public program = signal<any>({});
    public options = signal<AutoExtendOptions>({
        numberOfWeeks: 4,
        progressionTypes: {
            percentage: { enabled: true, amount: 2.5 },
            rpe: { enabled: false, amount: 0.5 },
            reps: { enabled: false, amount: 1 },
            sets: { enabled: false, amount: 1 }
        },
        progressionFrequency: 'every',
        progressionTimeframe: 1,
        progressionExercises: {}
    });
    
    public exercises = signal<Exercise[]>([]);
    public allExercises = signal<Exercise[]>([]);
    public showMore = signal<boolean>(false);

    constructor() {
        this.program.set(this.data.program || {});
        this.extractExercises();
    }

    ngOnInit(): void {
    }

    private extractExercises(): void {
        const exercisesList: Exercise[] = [];
        const allExercisesList: Exercise[] = [];
        const currentProgram = this.program();
        const currentOptions = this.options();

        for (const workout of currentProgram.workouts || []) {
            for (const exercise of workout.exercises || []) {
                if (!allExercisesList.find(ex => ex.exerciseid === exercise.exerciseid)) {
                    allExercisesList.push({
                        exerciseid: exercise.exerciseid,
                        name: exercise.name
                    });

                    // Only include exercises that have percentage, RPE, reps, or sets values
                    if (exercise.percentage || exercise.rpe || exercise.reps || exercise.sets) {
                        exercisesList.push({
                            exerciseid: exercise.exerciseid,
                            name: exercise.name,
                            enabled: true
                        });

                        // Initialize progression settings for this exercise
                        if (!currentOptions.progressionExercises[exercise.exerciseid]) {
                            currentOptions.progressionExercises[exercise.exerciseid] = {
                                enabled: false,
                                progressionTypes: {
                                    percentage: { enabled: true, amount: 2.5 },
                                    rpe: { enabled: false, amount: 0.5 },
                                    reps: { enabled: false, amount: 1 },
                                    sets: { enabled: false, amount: 1 }
                                }
                            };
                        }
                    }
                }
            }
        }

        this.exercises.set(exercisesList);
        this.allExercises.set(allExercisesList);
        this.options.set(currentOptions);
    }

    public cancel(): void {
        this.dialogRef.close();
    }

    public save(): void {
        const currentOptions = this.options();

        if (currentOptions.numberOfWeeks < 1 || currentOptions.numberOfWeeks > 52) {
            this.snackBar.open(
                this.translate.instant('Number of weeks must be between 1 and 52.'),
                '',
                { duration: 3000 }
            );
            return;
        }

        // Check if at least one progression type is enabled globally
        const hasEnabledProgression = Object.values(currentOptions.progressionTypes).some(
            (type: ProgressionType) => type.enabled
        );
        
        if (!hasEnabledProgression) {
            this.snackBar.open(
                this.translate.instant('At least one progression type must be enabled.'),
                '',
                { duration: 3000 }
            );
            return;
        }

        // Validate progression amounts
        for (const [type, config] of Object.entries(currentOptions.progressionTypes)) {
            if (config.enabled && config.amount <= 0) {
                this.snackBar.open(
                    this.translate.instant(`${type} progression amount must be greater than 0.`),
                    '',
                    { duration: 3000 }
                );
                return;
            }
        }

        this.dialogRef.close({ options: currentOptions });
    }

    public updateFrequency(): void {
        if (this.options().progressionFrequency === 'every') {
            this.options.update(opts => ({ ...opts, progressionTimeframe: 1 }));
        }
    }

    public toggleExerciseProgression(exercise: Exercise): void {
        const currentOptions = this.options();
        
        if (!currentOptions.progressionExercises[exercise.exerciseid]) {
            currentOptions.progressionExercises[exercise.exerciseid] = {
                enabled: true,
                progressionTypes: {
                    percentage: { enabled: true, amount: 2.5 },
                    rpe: { enabled: false, amount: 0.5 },
                    reps: { enabled: false, amount: 1 },
                    sets: { enabled: false, amount: 1 }
                }
            };
        } else {
            currentOptions.progressionExercises[exercise.exerciseid].enabled =
                !currentOptions.progressionExercises[exercise.exerciseid].enabled;
        }
        
        this.options.set(currentOptions);
    }

    public toggleExerciseProgressionType(exercise: Exercise, type: string): void {
        const currentOptions = this.options();
        
        if (!currentOptions.progressionExercises[exercise.exerciseid]) {
            currentOptions.progressionExercises[exercise.exerciseid] = {
                enabled: true,
                progressionTypes: {
                    percentage: { enabled: true, amount: 2.5 },
                    rpe: { enabled: false, amount: 0.5 },
                    reps: { enabled: false, amount: 1 },
                    sets: { enabled: false, amount: 1 }
                }
            };
        }

        const progressionTypes = currentOptions.progressionExercises[exercise.exerciseid].progressionTypes as any;
        progressionTypes[type].enabled = !progressionTypes[type].enabled;
        
        this.options.set(currentOptions);
    }

    public isExerciseProgressionTypeEnabled(exercise: Exercise, type: string): boolean {
        const currentOptions = this.options();
        const exerciseSettings = currentOptions.progressionExercises[exercise.exerciseid];
        return exerciseSettings?.progressionTypes?.[type as keyof ProgressionTypes]?.enabled || false;
    }

    public getExerciseProgressionAmount(exercise: Exercise, type: string): number {
        const currentOptions = this.options();
        const exerciseSettings = currentOptions.progressionExercises[exercise.exerciseid];
        return exerciseSettings?.progressionTypes?.[type as keyof ProgressionTypes]?.amount || 
               currentOptions.progressionTypes[type as keyof ProgressionTypes].amount;
    }

    public updateExerciseProgressionAmount(exercise: Exercise, type: string, amount: number): void {
        const currentOptions = this.options();
        
        if (!currentOptions.progressionExercises[exercise.exerciseid]) {
            currentOptions.progressionExercises[exercise.exerciseid] = {
                enabled: true,
                progressionTypes: {
                    percentage: { enabled: true, amount: 2.5 },
                    rpe: { enabled: false, amount: 0.5 },
                    reps: { enabled: false, amount: 1 },
                    sets: { enabled: false, amount: 1 }
                }
            };
        }

        const progressionTypes = currentOptions.progressionExercises[exercise.exerciseid].progressionTypes as any;
        progressionTypes[type].amount = amount;
        
        this.options.set(currentOptions);
    }

    public isExerciseEnabled(exercise: Exercise): boolean {
        return this.options().progressionExercises[exercise.exerciseid]?.enabled || false;
    }

    public getEnabledProgressionTypes(): string[] {
        return Object.entries(this.options().progressionTypes)
            .filter(([type, config]) => config.enabled)
            .map(([type]) => type);
    }

    public getProgressionTypeLabel(type: string): string {
        const labels: { [key: string]: string } = {
            percentage: 'Increase Percentage',
            rpe: 'Increase RPE',
            reps: 'Increase Reps',
            sets: 'Increase Sets'
        };
        return this.translate.instant(labels[type] || 'Increase Percentage');
    }

    public getProgressionAmountSuffix(type: string): string {
        return type === 'percentage' ? '%' : '';
    }

    public getEnabledExercisesCount(): number {
        return this.exercises().filter(ex => this.isExerciseEnabled(ex)).length;
    }
    
    public getProgressionAmount(type: string): number {
        const currentOptions = this.options();
        return currentOptions.progressionTypes[type as keyof ProgressionTypes]?.amount || 0;
    }
}
