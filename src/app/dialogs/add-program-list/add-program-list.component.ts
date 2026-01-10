import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';
import { ProgramService } from '../../services/program/program.service';
import { AddProgramComponent } from '../../dialogs/add-program/add-program.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import { ViewProgramComponent } from '../../dialogs/view-program/view-program.component';
import { ExerciseSearchPipe } from '../../pipes/exercise-search.pipe';
import moment from 'moment';

@Component({
  selector: 'app-add-program-list',
  templateUrl: './add-program-list.component.html',
  styleUrls: ['./add-program-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTabsModule,
    MatListModule,
    TranslateModule,
    SlicePipe,
    ExerciseSearchPipe
  ]
})
export class AddProgramListComponent {
    
    public dialogRef = inject(MatDialogRef<AddProgramListComponent>);
    public data = inject(MAT_DIALOG_DATA);
    public programService = inject(ProgramService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    public recommendedPrograms: Array<any>;
    public programs: Array<any>;
    public recentPrograms: Array<any>;   
    public properties: any;
    
    constructor() {
        this.properties = {search:"", programLimit:50, recentLoading:true, programLoading:true, selectedTab:0};

        this.recommendedPrograms = this.programService.getRecommendedPrograms();
        this.recentPrograms = [];
        this.programs = [];
      
        this.getRecentPrograms();
        this.getPrograms();
    }
    
    private getRecentPrograms(): void {
        this.programService.getRecentPrograms().then((data) => {
            this.properties.recentLoading = false;
            this.recentPrograms = data;
        });        
    }
    
    private getPrograms(): void {
        this.programService.getPrograms().then((data) => {
            this.properties.programLoading = false;
            this.programs = data;
        });          
    }
    
    public loadMorePrograms(): void {
        this.properties.programLimit += 50;
    }
    
    public canLoadMorePrograms(): boolean {
        if (this.properties.search){
            let returnItems = this.programs.filter(item => item.name.toLowerCase().indexOf(this.properties.search.toLowerCase()) !== -1);
            if (returnItems.length > this.properties.programLimit){
                return true
            }
        }       
        else if (this.programs.length > this.properties.programLimit){
            return true
        }
        
        return false;
    }
    
    public createProgram(programName: string): void {
       // Navigate to create program page
    }
    
    public selectProgram(program: any): void {
        if (!program.id){program.id = program.programid;}
        let dialogRef = this.dialog.open(ViewProgramComponent, {
            width: '600px',
            data: {program:program}
        });
        dialogRef.afterClosed().subscribe(data => {
            if (data){
                this.dialogRef.close(true);
            }
        })            
    }

    public dismiss(): void { 
        this.dialogRef.close();
    }            
    
    public numberWithCommas(x: number): string {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}
