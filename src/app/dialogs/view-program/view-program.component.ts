import { Component, inject, ViewEncapsulation, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { ProgramService } from '../../services/program/program.service';
import { AccountService } from '../../services/account/account.service';
import { TranslationService } from '../../services/translation/translation.service';
import { AddProgramComponent } from '../../dialogs/add-program/add-program.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import { ProgramComponent } from '../../pages/program/program.component';

@Component({
  selector: 'app-view-program',
  templateUrl: './view-program.component.html',
  styleUrls: ['./view-program.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    ProgramComponent
  ]
})
export class ViewProgramComponent {
    
    public dialogRef = inject(MatDialogRef<ViewProgramComponent>);
    public data = inject(MAT_DIALOG_DATA);
    public dialog = inject(MatDialog);
    private programService = inject(ProgramService);
    public snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private accountService = inject(AccountService);
    private translationService = inject(TranslationService);

    public program = signal<any>({});
    public account = signal<any>({});
    
    // Computed signal to check if current user is the program creator
    public isCreator = computed(() => {
        const prog = this.program();
        const acc = this.account();
        
        // Ensure both IDs are numbers for comparison
        const programUserId = prog.userid ? parseInt(prog.userid, 10) : null;
        const accountId = acc.id ? parseInt(acc.id, 10) : null;

        console.log(acc);
        console.log(prog);
        
        return programUserId !== null && accountId !== null && programUserId === accountId;
    });
    
    constructor() {
        this.program.set(this.data.program ? this.data.program : {});
        
        this.accountService.getAccountLocal().then((account: any) => {
            if (account) {
                this.account.set(account);
            }
        });
        
        // Subscribe to account updates
        this.accountService.getAccountObservable().subscribe((account: any) => {
            if (account && account.id) {
                this.account.set(account);
            }
        });
    }

    public addProgram(): void {
        const currentProgram = this.program();
        const dialogRef = this.dialog.open(AddProgramComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: { program: currentProgram }
        });
        
        dialogRef.afterClosed().subscribe(data => {
            if (data) {
                const maxes = data.maxes;
                const details = data.options;
                const snack = this.snackBar.open(
                    this.translationService.instant('Adding program...'),
                    '',
                    { duration: 5000 }
                );
                
                this.programService.updateExerciseMaxes(maxes).then(() => {
                    this.programService.addProgram(details).then(() => {
                        snack.dismiss();
                        const dialogRef2 = this.dialog.open(DisplayInformationComponent, {
                            width: '300px',
                            maxWidth: '95vw',
                            data: {
                                title: this.translationService.instant('Program Added!'),
                                content: this.translationService.instant(
                                    '{{programName}} has successfully been added to your diary on {{date}}.',
                                    {
                                        programName: currentProgram.name,
                                        date: moment(details.assigneddate).format('MMMM Do YYYY')
                                    }
                                ),
                                actions: [{
                                    name: this.translationService.instant('Go To Diary'),
                                    link: '/diary/' + details.assigneddate
                                }]
                            }
                        });
                        
                        dialogRef2.afterClosed().subscribe(() => {
                            this.dialogRef.close(true);
                        });
                    });
                });
            }
        });
    }
    
    public editProgram(): void {
        const currentProgram = this.program();
        this.router.navigate(['/programs', currentProgram.id, 'edit']);
        this.dialogRef.close(true);
    }
    
    public customizeProgram(): void {
        const currentProgram = this.program();
        
        // If user owns the program, ask if they want to edit or duplicate
/*         if (this.isCreator()) {
            const shouldEdit = confirm(
                this.translationService.instant('You created this program. Would you like to edit the original or create a customized copy?') + '\n\n' +
                this.translationService.instant('Click OK to edit, Cancel to create a copy.')
            );
            
            if (shouldEdit) {
                this.editProgram();
                return;
            }
        } */
        
        // Navigate to create page with customize parameter (using queryParams)
        this.router.navigate(['/programs/create'], {
            queryParams: { customize: currentProgram.id }
        });
        this.dialogRef.close(true);
    }
    
    public onProgramLoaded(programData: any): void {
        // Update the dialog's program signal with the fully loaded data
        console.log('Dialog received loaded program data:', programData);
        this.program.set(programData);
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
