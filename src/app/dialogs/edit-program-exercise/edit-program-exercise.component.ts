import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { SelectExerciseComponent } from '../select-exercise/select-exercise.component';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { InputDialogComponent } from '../input-dialog/input-dialog.component';
import { AccountService } from '../../services/account/account.service';

@Component({
    selector: 'app-edit-program-exercise',
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatCheckboxModule,
        MatSlideToggleModule,
        MatExpansionModule,
        CdkTextareaAutosize,
        TranslateModule
    ],
    templateUrl: './edit-program-exercise.component.html',
    styleUrls: ['./edit-program-exercise.component.scss']
})
export class EditProgramExerciseComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<EditProgramExerciseComponent>);
    private data = inject(MAT_DIALOG_DATA);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private accountService = inject(AccountService);
    private translate = inject(TranslateService);

    public exercise = signal<any>({});
    public account = signal<any>({});
    public rpeOptions: number[] = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

    constructor() {
        const exerciseData = this.data.exercise ? { ...this.data.exercise } : {};
        exerciseData.type = exerciseData.type || '';
        
        // Convert enable_rep_range from maxreps existence
        if (exerciseData.maxreps && !exerciseData.enable_rep_range) {
            exerciseData.enable_rep_range = true;
        }
        
        this.exercise.set(exerciseData);

        this.accountService.getAccountLocal().then((account: any) => {
            if (account) {
                this.account.set(account);
            }
        });
        
        this.accountService.getAccountObservable().subscribe((account: any) => {
            if (account && account.id) {
                this.account.set(account);
            }
        });
    }

    ngOnInit(): void {
        const currentExercise = this.exercise();
        if (currentExercise.rpe) {
            currentExercise.rpe = parseFloat(currentExercise.rpe);
            this.exercise.set(currentExercise);
        }
    }

    public cancel(): void {
        this.dialogRef.close();
    }

    public save(): void {
        const currentExercise = this.exercise();
        
        // If rep range is disabled, clear maxreps
        if (!currentExercise.enable_rep_range) {
            currentExercise.maxreps = null;
        }
        
        // Remove the enable_rep_range flag before saving (it's just for UI)
        const exerciseToSave = { ...currentExercise };
        delete exerciseToSave.enable_rep_range;
        
        this.dialogRef.close(exerciseToSave);
    }

    public toggleRepRange(): void {
        const currentExercise = this.exercise();
        if (!currentExercise.enable_rep_range) {
            currentExercise.maxreps = null;
        }
        this.exercise.set(currentExercise);
    }

    public determinePercentage(): void {
        const percentageTable: { [rpe: number]: number[] } = {
            10: [0, 100, 95, 90, 88, 86, 83, 80, 78, 76, 75, 72, 70, 66, 63, 60],
            9.5: [0, 98, 94, 91, 88, 85, 82, 80, 77, 75, 72, 69, 67, 64, 61, 59],
            9: [0, 96, 92, 89, 86, 84, 81, 79, 76, 74, 71, 68, 65, 63, 60, 57],
            8.5: [0, 94, 91, 88, 85, 82, 80, 77, 75, 72, 69, 67, 64, 61, 59, 56],
            8: [0, 92, 89, 86, 84, 81, 79, 76, 74, 71, 68, 65, 63, 60, 57, 55],
            7.5: [0, 91, 88, 85, 82, 80, 77, 75, 72, 69, 67, 64, 61, 59, 56, 53],
            7: [0, 89, 86, 84, 81, 79, 76, 74, 71, 68, 66, 63, 60, 58, 55, 53],
            6.5: [0, 88, 85, 82, 80, 77, 75, 72, 69, 67, 64, 61, 59, 56, 53, 50],
            6: [0, 86, 84, 81, 79, 76, 74, 71, 68, 66, 63, 61, 58, 55, 53, 50],
            5.5: [0, 85, 82, 80, 77, 75, 72, 69, 67, 64, 61, 59, 56, 53, 50, 48],
            5: [0, 84, 81, 79, 76, 74, 71, 68, 65, 63, 60, 57, 55, 52, 49, 46],
            4.5: [0, 82, 80, 77, 75, 72, 69, 67, 64, 61, 59, 56, 53, 50, 48, 45],
            4: [0, 81, 79, 76, 74, 71, 68, 65, 63, 60, 57, 55, 52, 49, 46, 44],
            3.5: [0, 80, 77, 75, 72, 69, 67, 64, 61, 59, 56, 53, 50, 48, 45, 42],
            3: [0, 79, 76, 74, 71, 68, 65, 63, 60, 57, 55, 52, 49, 46, 44, 41],
            2.5: [0, 77, 75, 72, 69, 67, 64, 61, 59, 56, 53, 50, 48, 45, 42, 40],
            2: [0, 76, 74, 71, 68, 65, 63, 60, 57, 55, 52, 49, 46, 44, 41, 38],
            1.5: [0, 75, 72, 69, 67, 64, 61, 59, 56, 53, 50, 48, 45, 42, 40, 37],
            1: [0, 74, 71, 68, 65, 63, 60, 57, 55, 52, 49, 46, 44, 41, 38, 36],
            0.5: [0, 72, 69, 67, 64, 61, 59, 56, 53, 50, 48, 45, 42, 40, 37, 34],
            0: [0, 71, 68, 65, 63, 60, 57, 55, 52, 49, 46, 44, 41, 38, 36, 33]
        };

        const currentExercise = this.exercise();
        const repsArray: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        const repsIndex = Math.min(Math.max(Math.floor(currentExercise.reps || 0), 0), repsArray.length - 1);

        if (!currentExercise.rpe) {
            currentExercise.percentage = currentExercise.reps > 15 ? 50 : percentageTable[10][repsIndex];
        } else {
            let rpe = this.account().intensity_scale === 'rir' ? (10 - currentExercise.rpe) : currentExercise.rpe;
            rpe = Math.min(Math.max(rpe, 0), 10);
            const rpeRounded = Math.round(rpe * 2) / 2;
            currentExercise.percentage = repsIndex > 15 ? 50 : percentageTable[rpeRounded][repsIndex];
        }
        
        this.exercise.set(currentExercise);
    }

    public getRpeExplanation(): string {
        const currentExercise = this.exercise();
        const currentAccount = this.account();
        
        if (!currentExercise.rpe) return '';
        
        const rpe = parseFloat(currentExercise.rpe);
        const decimal = rpe % 1;
        const whole = rpe - decimal;

        let rpeString = '';
        if (this.rpeOptions.indexOf(rpe) < 0) {
            rpeString += (currentAccount?.intensity_scale === 'rir' ? (10 - rpe) + ' RIR' : 'RPE ' + rpe) + '. ';
        }

        if (whole === 10) {
            return rpeString + this.translate.instant('Max effort. Could not do more reps or weight.');
        } else if (rpe > 9) {
            return rpeString + this.translate.instant('Could not do more reps. Possibly more weight.');
        } else if (decimal > 0) {
            const rir = (10 - whole);
            return rpeString + this.translate.instant('Could do') + ' ' + (rir - 1) + ' ' +
                   this.translate.instant('more') + ' ' +
                   this.translate.instant(((rir - 1) === 1 ? 'rep' : 'reps')) + '. ' +
                   this.translate.instant('Possibly') + ' ' + rir + '.';
        } else {
            const rir = (10 - whole);
            return rpeString + this.translate.instant('Could do') + ' ' + (10 - rpe) + ' ' +
                   this.translate.instant('more') + ' ' +
                   this.translate.instant(((10 - rpe) === 1 ? 'rep' : 'reps')) + '.';
        }
    }

    public editRpe(): void {
        const currentExercise = this.exercise();
        const currentAccount = this.account();
        
        const currentValue = currentExercise.rpe ?
            (currentAccount?.intensity_scale === 'rir' ? (10 - currentExercise.rpe) : currentExercise.rpe) :
            '';

        const label = currentAccount?.intensity_scale === 'rir' ? 'RIR' : 'RPE';
        const message = this.translate.instant('Enter a specific value for this exercise.');

        const dialogRef = this.dialog.open(InputDialogComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: {
                title: this.translate.instant('Edit') + ' ' + label,
                message: message,
                defaultValue: currentValue.toString(),
                inputType: 'number',
                placeholder: label
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.value !== null && result.value !== '') {
                let newRpe = currentAccount?.intensity_scale === 'rir' ?
                    (10 - parseFloat(result.value)) :
                    parseFloat(result.value);

                if (newRpe < 0) {
                    newRpe = 0;
                } else if (newRpe > 10) {
                    newRpe = 10;
                }

                currentExercise.rpe = newRpe;
                this.exercise.set(currentExercise);
            }
        });
    }

    public setRpe(rpeValue: number): void {
        const currentExercise = this.exercise();
        currentExercise.rpe = currentExercise.rpe === rpeValue ? null : rpeValue;
        this.exercise.set(currentExercise);
    }

    public async switchExercise(): Promise<void> {
        const dialogRef = this.dialog.open(SelectExerciseComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: {}
        });

        dialogRef.afterClosed().subscribe(async (exercise) => {
            if (exercise) {
                const currentExercise = this.exercise();
                currentExercise.name = exercise.name;
                currentExercise.exerciseid = exercise.exerciseid;
                this.exercise.set(currentExercise);

                // Ask if user wants to switch all occurrences
                const confirmDialogRef = this.dialog.open(ConfirmationComponent, {
                    width: '400px',
                    maxWidth: '95vw',
                    data: {
                        title: this.translate.instant('Switch All Occurrences'),
                        content: this.translate.instant('Would you like to also switch all other occurances of this exercise in this program?')
                    }
                });

                confirmDialogRef.afterClosed().subscribe((result) => {
                    if (result && result.confirm) {
                        currentExercise.switchAll = true;
                        this.exercise.set(currentExercise);
                    }
                });
            }
        });
    }

    public dismiss(): void {
        this.dialogRef.close();
    }
}
