import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import moment from 'moment';

@Component({
  selector: 'app-edit-program-workout',
  templateUrl: './edit-program-workout.component.html',
  styleUrls: ['./edit-program-workout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    TranslateModule
  ]
})
export class EditProgramWorkoutComponent {
    
    public dialogRef = inject(MatDialogRef<EditProgramWorkoutComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    public workout: any;
    
    constructor() {
        this.workout = {};
        Object.assign(this.workout, this.data.workout);
    }
    
    public update(): void {
        this.dialogRef.close(this.workout);
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
