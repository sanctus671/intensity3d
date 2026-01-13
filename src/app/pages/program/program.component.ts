import { Component, OnInit, signal, computed, inject, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';

import { ProgramService } from '../../services/program/program.service';
import { AccountService } from '../../services/account/account.service';
import { TranslationService } from '../../services/translation/translation.service';

import { ViewExerciseComponent } from '../../dialogs/view-exercise/view-exercise.component';
import { ViewWorkoutComponent } from '../../dialogs/view-workout/view-workout.component';
import { AddProgramComponent } from '../../dialogs/add-program/add-program.component';
import { AddWorkoutComponent } from '../../dialogs/add-workout/add-workout.component';
import { ViewProgramDetailsComponent } from '../../dialogs/view-program-details/view-program-details.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';

interface ProgramProperties {
  activeTab: string;
  loading: boolean;
  isDialog?: boolean;
}

@Component({
  selector: 'app-program',
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './program.component.html',
  styleUrls: ['./program.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramComponent implements OnInit {
  // Inputs using new input() function
  public name = input<string>();
  public id = input<number | string>();
  
  // Output to emit when program is loaded
  public programLoaded = output<any>();
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private programService = inject(ProgramService);
  private accountService = inject(AccountService);
  private translationService = inject(TranslationService);
  
  public properties = signal<ProgramProperties>({
    activeTab: 'Week 1',
    loading: true
  });
  public program = signal<any>({});
  public tabs = signal<string[]>(['Week 1']);
  public account = signal<any>({});
  public descriptionExpanded = signal<boolean>(false);
  
  // Computed signal to check if description needs truncation
  public shouldTruncateDescription = computed(() => {
    const description = this.program().description;
    return description && description.length > 200;
  });
  
  // Computed signal to check if current user is the program creator
  public isCreator = computed(() => {
    const prog = this.program();
    const acc = this.account();
    
    // Ensure both IDs are numbers for comparison
    const programUserId = prog.userid ? parseInt(prog.userid, 10) : null;
    const accountId = acc.id ? parseInt(acc.id, 10) : null;
    
    console.log('isCreator check - Program userid:', programUserId, 'Account id:', accountId, 'Match:', programUserId === accountId);
    
    return programUserId !== null && accountId !== null && programUserId === accountId;
  });

  constructor() {
    // Load account data
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

  ngOnInit(): void {
    // Get ID from input (dialog mode) or route params (page mode)
    const programId = this.id() || this.route.snapshot.params['id'];
    
    // Get name from input (dialog mode) or query params (page mode)
    const programName = this.name() || this.route.snapshot.queryParams['name'];
    
    // Ensure programId is a number
    const parsedProgramId = typeof programId === 'string' ? parseInt(programId, 10) : programId;
    
    this.program.set({
      id: parsedProgramId,
      name: programName
    });
    
    if (this.id()) {
      this.properties.update(props => ({ ...props, isDialog: true }));
    }
    
    // Only fetch program if we have a valid ID
    if (parsedProgramId) {
      this.getProgram();
    } else {
      this.properties.update(props => ({ ...props, loading: false }));
    }
  } 
    

  public editProgram(): void {
    const currentProgram = this.program();
    this.router.navigate(['/programs', currentProgram.id, 'edit']);
  }
  
  public customizeProgram(): void {
    const currentProgram = this.program();
    
    // If user owns the program, ask if they want to edit or duplicate
/*     if (this.isCreator()) {
      const shouldEdit = confirm(
        this.translationService.instant('You created this program. Would you like to edit the original or create a customized copy?') + '\n\n' +
        this.translationService.instant('Click OK to edit, Cancel to create a copy.')
      );
      
      if (shouldEdit) {
        this.editProgram();
        return;
      }
    } */
    
    // Navigate to create page with customize parameter
    this.router.navigate(['/programs/create'], { 
      queryParams: { customize: currentProgram.id } 
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
          });
        });
      }
    });
  }
    

    
  public addWorkout(workout: any): void {
    const dialogRef = this.dialog.open(AddWorkoutComponent, {
      width: '300px',
      maxWidth: '95vw',
      data: { workout }
    });
    
    dialogRef.afterClosed().subscribe(data => {
      if (data) {
        this.programService.addWorkout(
          workout.workoutid,
          moment(data.date).format('YYYY-MM-DD')
        ).then(() => {
          this.snackBar.open(
            this.translationService.instant(
              'Workout added to {{date}}!',
              { date: moment(data.date).format('MMMM Do YYYY') }
            ),
            '',
            { duration: 5000 }
          );
        });
      }
    });
  }
  
  public viewProgramDetails(): void {
    const currentProgram = this.program();
    this.dialog.open(ViewProgramDetailsComponent, {
      width: '300px',
      maxWidth: '95vw',
      data: { program: currentProgram }
    });
  }
  
  public viewWorkoutDetails(workout: any): void {
    this.dialog.open(ViewWorkoutComponent, {
      width: '300px',
      maxWidth: '95vw',
      data: { workout }
    });
  }    


  private async getProgram(): Promise<void> {
    const currentProgram = this.program();
    
    try {
      // Try to get local program first
      const localData = await this.programService.getProgramLocal(currentProgram.id);
      if (localData) {
        this.properties.update(props => ({ ...props, loading: false }));
        
        if (localData.workouts) {
          localData.workouts.sort((a: any, b: any) => a.day - b.day);
        }
        
        this.program.set(localData);
        this.calculateTabs();
        
        console.log('Program loaded from local storage:', localData);
        console.log('Program userid:', localData.userid, 'Account id:', this.account().id);
      }
    } catch (error) {
      // Local program not found, continue to fetch from server
    }
    
    try {
      // Fetch from server
      const response = await this.programService.getProgram(currentProgram.id);
      
      // The API returns an array with a single program object
      const data = Array.isArray(response) ? response[0] : response;
      
      this.properties.update(props => ({ ...props, loading: false }));
      
      if (data?.workouts) {
        data.workouts.sort((a: any, b: any) => a.day - b.day);
      }
      
      // Ensure userid is a number for comparison
      if (data.userid) {
        data.userid = parseInt(data.userid, 10);
      }
      
      this.program.set(data);
      this.calculateTabs();
      
      console.log('Program loaded from server:', data);
      console.log('Program userid:', data.userid, 'Account id:', this.account().id);
      
      // Emit the loaded program data to parent components
      this.programLoaded.emit(data);
    } catch (error) {
      console.error('Error fetching program:', error);
      this.properties.update(props => ({ ...props, loading: false }));
    }
  }
  
  private calculateTabs(): void {
    const currentProgram = this.program();
    const tabsCount = Math.ceil(parseInt(currentProgram.duration) / 7);
    
    if (tabsCount > 1) {
      const newTabs: string[] = [];
      for (let x = 1; x <= tabsCount; x++) {
        newTabs.push(`Week ${x}`);
      }
      this.tabs.set(newTabs);
    }
  }
  
  public isInTab(workout: any): boolean {
    const currentTabs = this.tabs();
    const currentProps = this.properties();
    const index = currentTabs.indexOf(currentProps.activeTab) + 1;
    const tab = Math.ceil(parseInt(workout.day) / 7);
    
    return index === tab;
  }
  
  public openExercise(exercise: any, workout: any): void {
    this.dialog.open(ViewExerciseComponent, {
      width: '300px',
      maxWidth: '95vw',
      data: { workout, exercise }
    });
  }


  public formatExerciseType(setType: string): string {
    const types: { [key: string]: string } = {
      amrap: 'AMRAP',
      ss: 'Super Set',
      ds: 'Drop Set',
      bs: 'Backoff Set',
      w: 'Warmup',
      c: 'Circuit'
    };
    
    return types[setType] || setType;
  }
  
  public formatURL(url: string): string {
    return String(url)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\//g, '');
  }
  
  public setActiveTab(tab: string): void {
    this.properties.update(props => ({ ...props, activeTab: tab }));
  }
  
  public toggleDescription(): void {
    this.descriptionExpanded.update(expanded => !expanded);
  }
  
  public getTruncatedDescription(): string {
    const description = this.program().description;
    if (!description) return '';
    
    if (this.descriptionExpanded() || description.length <= 180) {
      return description;
    }
    
    return description.substring(0, 180) + '...';
  }
}
