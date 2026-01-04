import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatBadgeModule } from '@angular/material/badge';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { SelectExerciseComponent } from '../../dialogs/select-exercise/select-exercise.component';
import { DiaryService } from '../../services/diary/diary.service';
import { AccountService } from '../../services/account/account.service';

@Component({
  selector: 'app-edit-program-exercise',
  templateUrl: './edit-program-exercise.component.html',
  styleUrls: ['./edit-program-exercise.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSliderModule,
    MatBadgeModule,
    CdkTextareaAutosize,
    TranslateModule
  ]
})
export class EditProgramExerciseComponent {
    
    public dialogRef = inject(MatDialogRef<EditProgramExerciseComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private diaryService = inject(DiaryService);
    private accountService = inject(AccountService);

    public exercise: any;
    public account: any;
    
    constructor() {
        this.exercise = {};
        
        if (this.data.exercise){
            Object.assign(this.exercise, this.data.exercise);
        }
        
        this.exercise.type = this.exercise.type ? this.exercise.type : "";
        this.exercise.rir = this.exercise.rpe && this.exercise.rpe !== "0" ? Math.round((10 - this.exercise.rpe)*100)/100 : null;

        this.account = {};
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
    }
    
    public calculatePercentage(): void {
        const percentages: {[key: number]: number} = {0:0,1:100,2:95,3:90,4:88,5:86,6:83,7:80,8:78,9:76,10:75,11:72,12:70,13:66,14:63,15:60};
        let repRounded = Math.floor(this.exercise.reps);
        this.exercise.percentage =  repRounded > 15 ? 50 : percentages[repRounded];        
    }
    
    public rirChanged(): void {
        this.exercise.rpe = 10 - this.exercise.rir;
    }  
    
    public deleteExercise(): void {
         this.dialogRef.close({delete:true});       
    }
    
    public switchExercise(): void {
        let dialogRef = this.dialog.open(SelectExerciseComponent, {
            width: '600px',
            data: {}
        });
        
        dialogRef.afterClosed().subscribe(exercise => {
            if (exercise){
                this.exercise.exerciseid = exercise.id;
                this.exercise.name = exercise.name;
            }
        })
    }
    
    public save(): void {
        this.dialogRef.close({exercise:this.exercise});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
    
    // Format function for slider display
    formatLabel(value: number): string {
        return value.toString();
    }
}
