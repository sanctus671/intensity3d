import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { TranslateModule } from '@ngx-translate/core';

import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { DiaryService } from '../../services/diary/diary.service';
import { AccountService } from '../../services/account/account.service';
import { ViewPremiumComponent } from '../../dialogs/view-premium/view-premium.component';

@Component({
  selector: 'app-edit-set',
  templateUrl: './edit-set.component.html',
  styleUrls: ['./edit-set.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatSelectModule,
    MatSliderModule,
    MatBadgeModule,
    MatExpansionModule,
    CdkTextareaAutosize,
    TranslateModule
  ]
})
export class EditSetComponent {
    
    public dialogRef = inject(MatDialogRef<EditSetComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private diaryService = inject(DiaryService);
    private accountService = inject(AccountService);

    public set: any;
    public exercise: any;
    public account: any;
    
    constructor() {
        this.set = {};
        
        if (this.data.set){
            Object.assign(this.set, this.data.set);
        }
        
        this.set.type = this.set.type ? this.set.type : "";
        this.set.rir = this.set.rpe && this.set.rpe !== "0" ? Math.round((10 - this.set.rpe)*100)/100 : null;

        this.account = {};
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
    }
    
    public calculatePercentage(): void {
        const percentages: {[key: number]: number} = {0:0,1:100,2:95,3:90,4:88,5:86,6:83,7:80,8:78,9:76,10:75,11:72,12:70,13:66,14:63,15:60};
        let repRounded = Math.floor(this.set.reps);
        this.set.percentage = repRounded > 15 ? 50 : percentages[repRounded];        
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
                this.account.premium = true;
            }
        })         
    }    
    
    public videoFileChangeListener($event: any): void {
        const files = $event.srcElement.files;
        const mediaFile: File = files[0];

        const snackBarRef = this.snackBar.open('File is uploading...', '', {
          duration: 10000
        });

        this.diaryService.uploadVideo(mediaFile, this.set.id).then((video) => {
            this.set.video = video;
            snackBarRef.dismiss();
        }).catch(() => {
            snackBarRef.dismiss();
        });
    }

    uploadVideo(): void {
        if (!this.account.premium){
            this.openPremium();
            return;
        }
        
        document.getElementById('videoFile')?.click();
    }  
    
    public rirChanged(): void {
        this.set.rpe = 10 - this.set.rir;
    }  
    
    public deleteSet(): void {
        this.dialogRef.close({delete:true});       
    }
    
    public add(): void {
        this.dialogRef.close({set:this.set});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
    
    // Format function for slider display
    formatLabel(value: number): string {
        return value.toString();
    }
}
