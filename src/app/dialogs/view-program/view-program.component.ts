import { Component, inject, ViewEncapsulation } from '@angular/core';
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
import { AddProgramComponent } from '../../dialogs/add-program/add-program.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';

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
    TranslateModule
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

    public program: any;
    public account: any;
    
    constructor() {
        this.program = this.data.program ? this.data.program : {};
        
        this.account = {};
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });         
    }

    public addProgram(): void {
        let dialogRef = this.dialog.open(AddProgramComponent, {
            width: '400px',
            data: {program:this.program}
        }); 
        
        dialogRef.afterClosed().subscribe(data => {
            if (data){
                let maxes = data.maxes;
                let details = data.options;
                let snack = this.snackBar.open('Adding program...', '', {
                    duration: 5000
                });                 
                this.programService.updateExerciseMaxes(maxes).then(() => {
                    this.programService.addProgram(details).then(() => {
                        snack.dismiss();
                        let dialogRef2 = this.dialog.open(DisplayInformationComponent, {
                            width: '300px',
                            data: {
                            title:"Program Added!", 
                            content:this.program.name + " has successfully been added to your diary on " + moment(details.assigneddate).format("MMMM Do YYYY") + ".",
                            actions:[{name: "Go To Diary", link: "/diary/" + details.assigneddate}]}
                        });   
                        
                        dialogRef2.afterClosed().subscribe(data => {
                            this.dialogRef.close(true);
                        });
                    });
                });
            }
        })        
    }   
    
    public editProgram(): void {
        this.router.navigate(['/programs/' + this.program.id + '/edit']);
        this.dialogRef.close(true);
    }        
    
    public customizeProgram(): void {
        this.router.navigate(['/programs/create', {customize:this.program.id}]);
        this.dialogRef.close(true);
    }
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
