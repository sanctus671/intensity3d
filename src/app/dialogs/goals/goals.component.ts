import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RoundProgressModule } from '@edumetz16/angular-svg-round-progressbar';
import { AccountService } from '../../services/account/account.service';

@Component({
  selector: 'app-goals',
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    RoundProgressModule
  ]
})
export class GoalsComponent {
    
    public dialogRef = inject(MatDialogRef<GoalsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    private translate = inject(TranslateService);

    public exercise: any;
    public barColour: string;
    public account: any = {goals: {}}; 
    
    constructor() {
        this.exercise = this.data.exercise ? this.data.exercise : {sets:[], goals:{goal:0,progress:0}};
        this.barColour = this.exercise.calibrating ? '#d47835' : '#d44735';

        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
            console.log(account);
        });
    }
    
    public getGoalDetails(): string {
        if (this.account.goals.primary === 'none'){
            return this.translate.instant('You currently have goals turned off. You can change this in your settings.');
        } else {       
            let progressPecentage = Math.round((this.exercise.goals.progress / this.exercise.goals.goal)*100);
            let remaining = this.exercise.goals.goal - this.exercise.goals.progress;
            let remainingPercentage = Math.round((remaining / this.exercise.goals.goal) * 100)
            
            const goalDescription = this.translate.instant('Your goal is currently set as') + 
                ' <strong>' + this.account.goals.target + '</strong> <strong>' + this.account.goals.primary + '</strong> ' + 
                this.translate.instant('grouped by') + ' <strong>' + this.account.goals.grouping + '</strong>. ' +
                this.translate.instant('Your timeframe is a') + ' <strong>' + this.account.goals.timeframe + '</strong>. ' +
                this.translate.instant('You can change this in your') + ' <a href="/settings">' + this.translate.instant('settings') + '</a>.<br>';

            const goalDetails = '<h3>' + progressPecentage + '% ' + this.translate.instant('complete') + '</h3>' +
                '<h4>' + remaining + this.account.units + ' (' + remainingPercentage + '%) ' + this.translate.instant('to go') + '</h4>' +
                '<p>' + goalDescription + '</p>';

            return goalDetails; 
        }       
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
