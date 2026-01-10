import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatExpansionModule } from '@angular/material/expansion';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { InputDialogComponent } from '../input-dialog/input-dialog.component';
import { PlateCalculatorComponent } from '../tools/plate-calculator/plate-calculator.component';
import { RecordHistoryComponent } from '../record-history/record-history.component';
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
    private translateService = inject(TranslateService);
    private matIconRegistry = inject(MatIconRegistry);
    private domSanitizer = inject(DomSanitizer);

    public set: any;
    public recordSet: any;
    public exercise: any;
    public account: any;
    public rpeOptions: Array<number> = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];
    
    constructor() {
        // Register custom SVG icons
        this.matIconRegistry.addSvgIcon(
            'plates',
            this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icon/platesicon.svg')
        );
        
        this.set = {};
        
        if (this.data.set){
            console.log(this.data.set);
            Object.assign(this.set, this.data.set);
        }
        
        this.set.type = this.set.type ? this.set.type : "";

        if (this.set.rpe) {
            this.set.rpe = parseFloat(this.set.rpe);
        }

        this.recordSet = {reps: this.set.reps, weight: this.set.weight};

        this.account = {};
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
    }
    
    public calculatePercentage(): void {
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
    
        const repsArray: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
        const repsIndex = Math.min(Math.max(Math.floor(this.set.reps), 0), repsArray.length - 1);
    
        if (!this.set.rpe) {
            this.set.percentage = this.set.reps > 15 ? 50 : percentageTable[10][repsIndex];
        } else {
            let rpe = this.set.rpe;
            rpe = Math.min(Math.max(rpe, 0), 10);
            const rpeRounded = Math.round(rpe * 2) / 2;
            this.set.percentage = repsIndex > 15 ? 50 : percentageTable[rpeRounded][repsIndex];
        }
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
    
    public getRpeExplanation(): string {
        let rpe = parseFloat(this.set.rpe);
        let decimal = rpe % 1;
        let whole = rpe - decimal;

        let rpeString = "";
        if (this.rpeOptions.indexOf(rpe) < 0) {
            rpeString += (this.account && this.account.intensity_scale === "rir" ? (10 - rpe) + " RIR" : "RPE " + rpe) + ". ";
        }

        if (whole === 10) {
            return rpeString + this.translateService.instant("Max effort. Could not do more reps or weight.");
        } else if (rpe > 9) {
            return rpeString + this.translateService.instant("Could not do more reps. Possibly more weight.");
        } else if (decimal > 0) {
            let rir = (10 - whole);
            return rpeString + this.translateService.instant("Could do") + " " + (rir - 1) + " " + 
                   this.translateService.instant("more") + " " + 
                   this.translateService.instant(((rir - 1) === 1 ? "rep" : "reps")) + ". " + 
                   this.translateService.instant("Possibly") + " " + rir + ".";
        } else {
            let rir = (10 - whole);
            return rpeString + this.translateService.instant("Could do") + " " + (10 - rpe) + " " + 
                   this.translateService.instant("more") + " " + 
                   this.translateService.instant(((10 - rpe) === 1 ? "rep" : "reps")) + ".";
        }
    }

    public async editRpe(): Promise<void> {
        const currentValue = this.set.rpe ? 
            (this.account && this.account.intensity_scale === "rir" ? (10 - this.set.rpe) : this.set.rpe) : 
            '';
        
        const label = this.account && this.account.intensity_scale === "rir" ? "RIR" : "RPE";
        const message = this.translateService.instant("Enter a specific value for this set.");
        
        const dialogRef = this.dialog.open(InputDialogComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: {
                title: this.translateService.instant("Edit") + " " + label,
                message: message,
                defaultValue: currentValue.toString(),
                inputType: 'number',
                placeholder: label
            }
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.value !== null && result.value !== '') {
                let newRpe = this.account && this.account.intensity_scale === "rir" ? 
                    (10 - parseFloat(result.value)) : 
                    parseFloat(result.value);
                
                if (newRpe < 0) {
                    newRpe = 0;
                } else if (newRpe > 10) {
                    newRpe = 10;
                }
                
                this.set.rpe = newRpe;
            }
        });
    }
    
    public openPlateCalculator(): void {
        this.dialog.open(PlateCalculatorComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: { set: this.set }
        });
    }

    public openRecordHistory(): void {
        if (!this.account.premium) {
            this.openPremium();
            return;
        }

        const set = {...this.set};
        set.rep = set.reps;
        set.max = set.weight;

        this.dialog.open(RecordHistoryComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: { 
                user: this.account, 
                set: set, 
                type: 'overall', 
                exercise: this.data.exercise 
            }
        });
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
}
