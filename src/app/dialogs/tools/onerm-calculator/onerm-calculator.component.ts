import { Component, ChangeDetectionStrategy, signal, computed, inject, OnInit } from '@angular/core';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { AccountService } from '../../../services/account/account.service';
import { InputDialogComponent } from '../../input-dialog/input-dialog.component';

@Component({
  selector: 'app-onerm-calculator',
  templateUrl: './onerm-calculator.component.html',
  styleUrls: ['./onerm-calculator.component.scss'],
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
    FormsModule,
    DecimalPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnermCalculatorComponent implements OnInit {
    private dialogRef = inject(MatDialogRef<OnermCalculatorComponent>);
    private dialog = inject(MatDialog);
    private translate = inject(TranslateService);
    private accountService = inject(AccountService);

    user = signal<any>({});
    reps = signal<number | null>(null);
    weight = signal<number | null>(null);
    rpe = signal<number | null>(null);
    rpeOptions: Array<number> = [6,6.5,7,7.5,8,8.5,9,9.5,10];

    constructor() { }

    ngOnInit(): void {
        this.accountService.getAccountObservable().subscribe((user: any) => {
            if (user && user.id) {
                this.user.set(user);
            }
        });
    }

    cancel(): void {
        this.dialogRef.close();
    }
    
    getMax(): number {
        const percentageTable: { [rpe: number]: number[] } = {
            10: [0, 1.00, 0.95, 0.90, 0.88, 0.86, 0.83, 0.80, 0.78, 0.76, 0.75, 0.72, 0.70, 0.66, 0.63, 0.60],
            9.5: [0, 0.98, 0.94, 0.91, 0.88, 0.85, 0.82, 0.80, 0.77, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59],
            9: [0, 0.96, 0.92, 0.89, 0.86, 0.84, 0.81, 0.79, 0.76, 0.74, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57],
            8.5: [0, 0.94, 0.91, 0.88, 0.85, 0.82, 0.80, 0.77, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56],
            8: [0, 0.92, 0.89, 0.86, 0.84, 0.81, 0.79, 0.76, 0.74, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57, 0.55],
            7.5: [0, 0.91, 0.88, 0.85, 0.82, 0.80, 0.77, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56, 0.53],
            7: [0, 0.89, 0.86, 0.84, 0.81, 0.79, 0.76, 0.74, 0.71, 0.68, 0.66, 0.63, 0.60, 0.58, 0.55, 0.53],
            6.5: [0, 0.88, 0.85, 0.82, 0.80, 0.77, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56, 0.53, 0.50],
            6: [0, 0.86, 0.84, 0.81, 0.79, 0.76, 0.74, 0.71, 0.68, 0.66, 0.63, 0.61, 0.58, 0.55, 0.53, 0.50],
            5.5: [0, 0.85, 0.82, 0.80, 0.77, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56, 0.53, 0.50, 0.48],
            5: [0, 0.84, 0.81, 0.79, 0.76, 0.74, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57, 0.55, 0.52, 0.49, 0.46],
            4.5: [0, 0.82, 0.80, 0.77, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56, 0.53, 0.50, 0.48, 0.45],
            4: [0, 0.81, 0.79, 0.76, 0.74, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57, 0.55, 0.52, 0.49, 0.46, 0.44],
            3.5: [0, 0.80, 0.77, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56, 0.53, 0.50, 0.48, 0.45, 0.42],
            3: [0, 0.79, 0.76, 0.74, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57, 0.55, 0.52, 0.49, 0.46, 0.44, 0.41],
            2.5: [0, 0.77, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56, 0.53, 0.50, 0.48, 0.45, 0.42, 0.40],
            2: [0, 0.76, 0.74, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57, 0.55, 0.52, 0.49, 0.46, 0.44, 0.41, 0.38],
            1.5: [0, 0.75, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56, 0.53, 0.50, 0.48, 0.45, 0.42, 0.40, 0.37],
            1: [0, 0.74, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57, 0.55, 0.52, 0.49, 0.46, 0.44, 0.41, 0.38, 0.36],
            0.5: [0, 0.72, 0.69, 0.67, 0.64, 0.61, 0.59, 0.56, 0.53, 0.50, 0.48, 0.45, 0.42, 0.40, 0.37, 0.34],
            0: [0, 0.71, 0.68, 0.65, 0.63, 0.60, 0.57, 0.55, 0.52, 0.49, 0.46, 0.44, 0.41, 0.38, 0.36, 0.33]
        };
    
        let max = 0;
        const currentReps = this.reps();
        const currentWeight = this.weight();
        const currentRpe = this.rpe();
        
        if (!currentReps || !currentWeight) {
            return max;
        }

        if (currentReps > 15){
            max = Math.round((currentWeight * (1 + 0.0333 * currentReps)) * 100) / 100;
            return max;
        }
    
        const repsArray: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        const repsIndex = Math.min(Math.max(Math.floor(currentReps), 0), repsArray.length - 1);

        let rpe = 10;
        if (currentRpe){
            rpe = currentRpe;
            rpe = Math.min(Math.max(rpe, 0), 10); // Ensure RPE is within the table range
        }

        const rpeRounded = Math.round(rpe * 2) / 2; // Round to nearest 0.5

        const percentage = percentageTable[rpeRounded][repsIndex];
        max = Math.round((currentWeight / percentage) * 100) / 100;
    
        return max;     
    }




    editRpe(): void {
        const currentUser = this.user();
        const currentRpe = this.rpe();
        const inputValue = currentUser.intensity_scale === "rir" && currentRpe ? (10 - currentRpe) : currentRpe;
        const label = currentUser.intensity_scale === "rir" ? "RIR" : "RPE";
        
        const dialogRef = this.dialog.open(InputDialogComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: {
                title: this.translate.instant("Edit") + " " + label,
                message: '',
                defaultValue: inputValue?.toString() || '',
                inputType: 'number',
                placeholder: label
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.value !== null && result.value !== '') {
                let newRpe = currentUser.intensity_scale === "rir" ? (10 - parseFloat(result.value)) : parseFloat(result.value);
                if (newRpe < 0) newRpe = 0;
                else if (newRpe > 10) newRpe = 10;
                this.rpe.set(newRpe);
            }
        });
    }

    getRpeExplaination(): string {
        const currentRpe = this.rpe();
        const currentUser = this.user();
        
        if (!currentRpe) {
            return '';
        }

        const rpe = currentRpe;
        const decimal = rpe % 1;
        const whole = rpe - decimal;

        let rpeString = "";
        if (this.rpeOptions.indexOf(rpe) < 0){
            rpeString += (currentUser.intensity_scale === "rir" ? (10 - rpe) + " RIR" : "RPE " + rpe) + ". ";
        }

        if (whole === 10){
            return  rpeString + this.translate.instant("Max effort. Could not do more reps or weight.");
        }
        else if (rpe > 9){
            return  rpeString + this.translate.instant("Could not do more reps. Possibly more weight.");
        }
        else if (decimal > 0){
            const rir = (10 - whole);
            return  rpeString + this.translate.instant("Could do") + " " + (rir - 1) + " " + this.translate.instant("more") + " " + this.translate.instant(((rir - 1) === 1 ? "rep" : "reps")) + ". " + this.translate.instant("Possibly") + " " + rir + ".";
        }
        else{
            return  rpeString + this.translate.instant("Could do") + " " + (10 - rpe) + " " + this.translate.instant("more") + " " + this.translate.instant(((10 - rpe) === 1 ? "rep" : "reps")) + "."
        }
    }
}
