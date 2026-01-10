import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { PlateCalculatorComponent } from '../tools/plate-calculator/plate-calculator.component';

@Component({
  selector: 'app-add-set',
  templateUrl: './add-set.component.html',
  styleUrls: ['./add-set.component.scss'],
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
export class AddSetComponent {
    
    public dialogRef = inject(MatDialogRef<AddSetComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private dialog = inject(MatDialog);
    private accountService = inject(AccountService);
    private matIconRegistry = inject(MatIconRegistry);
    private domSanitizer = inject(DomSanitizer);

    public set: any;
    public exercise: any;
    public account: any;
    
    constructor() {
        // Register custom SVG icons
        this.matIconRegistry.addSvgIcon(
            'plates',
            this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icon/platesicon.svg')
        );
        
        
        this.exercise = this.data.exercise ? this.data.exercise : {sets:[]};
        
        if (this.exercise.sets.length > 0){
            let lastSet = this.exercise.sets[this.exercise.sets.length - 1];
            this.exercise.reps = lastSet.reps;
            this.exercise.weight = lastSet.weight;
        }
        
        this.set = {rpe:null, reps:this.exercise.reps, weight:this.exercise.weight, multiple:1};
        
        if (this.set.reps){
            this.calculatePercentage();
        }
        
        this.accountService.getAccountLocal().then((account) => {
            this.account = account;
            this.set.unit = this.account.units;
            this.set.completed = this.account.autocomplete;
        });
    }
    
    public calculatePercentage(): void {
        const percentages: {[key: number]: number} = {0:0,1:100,2:95,3:90,4:88,5:86,6:83,7:80,8:78,9:76,10:75,11:72,12:70,13:66,14:63,15:60};
        let repRounded = Math.floor(this.set.reps);
        this.set.percentage =  repRounded > 15 ? 50 : percentages[repRounded];        
    }
    
    public openPlateCalculator(): void {
        this.dialog.open(PlateCalculatorComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: { set: this.set }
        });
    }
    
    public add(): void {
        this.calculatePercentage();
        this.dialogRef.close({set:this.set});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
