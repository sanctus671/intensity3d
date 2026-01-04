import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
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
    CdkTextareaAutosize,
    TranslateModule
  ]
})
export class EditProfileComponent {
    
    public dialogRef = inject(MatDialogRef<EditProfileComponent>);
    public data = inject(MAT_DIALOG_DATA);

    public profile: any;
    
    constructor() {
        this.profile = {};
        
        if (this.data.profile){
            Object.assign(this.profile, this.data.profile);
        }
    }
    
    public save(): void {
        delete this.profile.dp;
        this.dialogRef.close({profile:this.profile});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
