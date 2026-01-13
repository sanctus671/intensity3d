import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';

@Component({
  selector: 'app-copy-program-workout',
  templateUrl: './copy-program-workout.component.html',
  styleUrls: ['./copy-program-workout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    TranslateModule
  ]
})
export class CopyProgramWorkoutComponent {
    
    public dialogRef = inject(MatDialogRef<CopyProgramWorkoutComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    public workout: any;
    public workouts: Array<any>;
    
    constructor() {
        this.workout = this.data.workout ? this.data.workout : {};
        this.workouts = [];
        
        if (this.data.program){
            for (var index in this.data.program.workouts){
                let workout = this.data.program.workouts[index];
                this.workouts.push({name:workout.name, value:false, index: parseInt(index), type:"checkbox"});
            }    
        }
    }
    
    public copy(): void {
        this.dialogRef.close(this.workouts);
    } 
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
