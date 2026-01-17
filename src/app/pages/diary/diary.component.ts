import { Component, OnInit, ViewEncapsulation, inject, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, SlicePipe } from '@angular/common';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { ActivatedRoute } from '@angular/router';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import moment from 'moment';
import { register } from 'swiper/element/bundle';

import { DiaryService } from '../../services/diary/diary.service';
import { ExerciseService } from '../../services/exercise/exercise.service';
import { TimerService } from '../../services/timer/timer.service';

import { AddExerciseComponent } from '../../dialogs/add-exercise/add-exercise.component';
import { AddProgramListComponent } from '../../dialogs/add-program-list/add-program-list.component';
import { AddSetComponent } from '../../dialogs/add-set/add-set.component';
import { EditSetComponent } from '../../dialogs/edit-set/edit-set.component';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import { CopyToDateComponent } from '../../dialogs/copy-to-date/copy-to-date.component';
import { CopyFromDateComponent } from '../../dialogs/copy-from-date/copy-from-date.component';
import { ShareComponent } from '../../dialogs/share/share.component';
import { GoalsComponent } from '../../dialogs/goals/goals.component';
import { RecordsComponent } from '../../dialogs/records/records.component';
import { HistoryComponent } from '../../dialogs/history/history.component';
import { StatsComponent } from '../../dialogs/stats/stats.component';
import { ManageProgramComponent } from '../../dialogs/manage-program/manage-program.component';
import { ViewPooledWorkoutComponent } from '../../dialogs/view-pooled-workout/view-pooled-workout.component';
import { WorkoutPoolComponent } from '../../dialogs/workout-pool/workout-pool.component';


@Component({
  selector: 'app-diary',
  templateUrl: './diary.component.html',
  styleUrls: ['./diary.component.scss'],
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    DragDropModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslateModule,
    SlicePipe
  ]
})
export class DiaryComponent implements OnInit, AfterViewInit {
    
    private diaryService = inject(DiaryService);
    private exerciseService = inject(ExerciseService);
    private timerService = inject(TimerService);
    public dialog = inject(MatDialog);
    public snackBar = inject(MatSnackBar);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);
    private elementRef = inject(ElementRef);
    private matIconRegistry = inject(MatIconRegistry);
    private domSanitizer = inject(DomSanitizer);
    
    public selectedDate: any;
    public selectedDateString: string = '';
    public workouts: any = {};
    public loading: boolean = false;
    
    public selectedDateCalendar: Date = new Date();
    public workoutDates: Array<any> = [];
    public minDate: Date | null = null;   
         
    public weekdays: Array<any> = [];
    public skipWeekdayUpdate: boolean = false;
    private isCalendarClick: boolean = false;
    private swiperInstance: any = null;
    
    @ViewChild('swiperContainer') swiperContainer!: ElementRef;
    
    public quickAddExercises: Array<any> = [];
    
    public workoutPool: Array<any> = [];
    public activePrograms: Array<any> = [];    

    constructor() {   
        // Register Swiper web component
        register();
        
        // Register custom SVG icon
        this.matIconRegistry.addSvgIcon(
            'diary-empty',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icon/diaryempty.svg')
        );
        
        const date = this.route.snapshot.params['date'];
        if (date) {
            
            this.diaryService.setSelectedDate(moment(date));
        }
        
        this.monitorSelectedDate();
        this.setQuickAddExercises();
        this.getDiaryData(); 
    }
    

    ngOnInit() {
  
    }
    
    ngAfterViewInit() {
        setTimeout(() => {
            this.initSwiper();
        }, 200);
    }
    
    private initSwiper(): void {
        if (this.swiperContainer && this.swiperContainer.nativeElement) {
            const swiperEl = this.swiperContainer.nativeElement;
            
            // Configure swiper parameters before initialization
            Object.assign(swiperEl, {
                slidesPerView: 7,
                spaceBetween: 0,
                slidesPerGroup: 1,
                centeredSlides: false,
                initialSlide: 50, // Start at the selected date (middle of array)
            });
            
            // Initialize the swiper
            swiperEl.initialize();
            
            // Get the swiper instance
            this.swiperInstance = swiperEl.swiper;
            
            if (this.swiperInstance) {
                // Add event listeners
                this.swiperInstance.on('slideChange', () => {
                    this.onSlideChange();
                });
                
                this.swiperInstance.on('slideChangeTransitionEnd', () => {
                    this.onSlideChangeTransitionEnd();
                });
            }
        }
    } 
    
    public viewWorkoutPool(workoutPool: any): void {
        let dialogRef = this.dialog.open(WorkoutPoolComponent, {
            width: '600px',
            data: {workoutPool: this.workoutPool},
            autoFocus: false
        }); 
        
        dialogRef.afterClosed().subscribe(data => {
            if (data){
                if (data.workout){
                    this.addPooledWorkout(false,data.workout);
                }
                else{
                    this.workoutDates = [];
                    this.getDiaryData(); 
                    this.getWorkout();
                }
            }
        })     
    }      
    
    
    public viewPooledWorkout(workout: any): void {
        let dialogRef = this.dialog.open(ViewPooledWorkoutComponent, {
            width: '300px',
            data: {workout:workout},
            autoFocus: false
        });          
    }
    
    
    
    public addPooledWorkout(ev: any, workout: any): void {
        if (ev){
            ev.stopPropagation();
        }
        let formattedDate = moment(this.selectedDate).format('YYYY-MM-DD');
        if (workout.id === this.workoutPool[0].id){this.workoutPool.shift();}
        
        let dialogRef = this.dialog.open(DisplayInformationComponent, {
            width: '300px',
            data: {title:"Workout added", content:workout.workout_name + " has been added to your diary."},
            autoFocus: false
        });          
        
        this.diaryService.addWorkoutFromPool(workout.workoutid, formattedDate, workout.id).then((data) => {
            this.getWorkout();
        }).catch(() => {  
            this.snackBar.open('Failed to add workout', '', {
                duration: 5000
            });                     
        });        
    }
    
    
    
    public manageProgram(program: any): void {
        let dialogRef = this.dialog.open(ManageProgramComponent, {
            width: '600px',
            data: {program: program},
            autoFocus: false
        }); 
        
        dialogRef.afterClosed().subscribe(data => {
            if (data){
                this.workoutDates = [];
                this.getDiaryData(); 
                this.getWorkout();
            }
        })     
    }    
    
    
    public getDiaryData(): void {
        this.workoutPool = [];
        this.diaryService.getDiaryData().then((data) => {

            let workoutDates = data["dates"];
            for (let date of workoutDates){
                this.workoutDates.push(date.assigneddate);
            }           
            this.minDate = new Date("1970-01-01T00:00:00.000Z"); //used to rerender dateClass
            
            if (this.weekdays.length > 0){
                for (let day of this.weekdays){
                    if (this.workoutDates.indexOf(day.moment.format("YYYY-MM-DD")) > -1){
                        day.hasWorkout = true;
                    }
                }
            }
            
            
             
            let workoutPool = data["pool"];
            
            if (workoutPool && workoutPool.length > 0){
                this.workoutPool = workoutPool.filter((workout: any) => {
                    return !workout.added || workout.added === "0";
                });
            }
            
            this.activePrograms = data["programs"];
            this.cdr.markForCheck();
            
        }).catch(() => {
            
        });        
    }   
    

    public openStats(exercise: any): void {
        let dialogRef = this.dialog.open(StatsComponent, {
            width: '600px',
            data: {exercise: exercise},
            autoFocus: false
        });         
    }
    
    
    public openHistory(exercise: any): void {
        let dialogRef = this.dialog.open(HistoryComponent, {
            width: '450px',
            data: {exercise: exercise, date: this.selectedDateString},
            autoFocus: false
        });
        
        dialogRef.afterClosed().subscribe(result => {
            if (result && result.action === 'viewDiary' && result.date) {
                this.diaryService.setSelectedDate(moment(result.date));
            }
        });
    }
    
    
    public openRecords(exercise: any): void {
        let dialogRef = this.dialog.open(RecordsComponent, {
            width: '710px',
            data: {exercise: exercise},
            autoFocus: false
        });         
    }            
    
        
    public openGoals(exercise: any): void {
        let dialogRef = this.dialog.open(GoalsComponent, {
            width: '400px',
            data: {exercise: exercise},
            autoFocus: false
        });         
    }
    
    public shareExercise(exercise: any): void {
        let dialogRef = this.dialog.open(ShareComponent, {
            width: '600px',
            data: {workout: this.workouts[this.selectedDateString], exercise: exercise, shareType: "workout", title: "Intensity Workout - " + this.selectedDate.format('dddd, MMMM Do YYYY')}
        });   
    }     
    
    public copyWorkout(date: any): void {
        let dialogRef = this.dialog.open(CopyFromDateComponent, {
            width: '300px',
            data: {date:date}
        });
        dialogRef.afterClosed().subscribe(data => {

            if (data && data.details){
                let copyFromDate = moment(data.details.date).format('YYYY-MM-DD');
                let copy = {
                    userid: data.details.userid,
                    exerciseid: null,
                    type:"workout",
                    date: this.selectedDateString,
                    assigneddate: copyFromDate
                }   
                
                this.snackBar.open('Copying workout...', '', {
                  duration: 5000
                });  
                
                this.diaryService.copyWorkout(copy).then(() => {
                    this.snackBar.open('Workout copied to ' + moment(this.selectedDateString).format('MMMM Do YYYY') + '!', '', {
                        duration: 5000
                    });  
                    
                    this.getWorkout();
                                       
                }).catch(() => {
                    this.snackBar.open('Failed to copy workout', '', {
                        duration: 5000
                    });                     
                })                      
            }
            
        })     
    }     
    
    public copyExercise(exercise: any): void {
        let dialogRef = this.dialog.open(CopyToDateComponent, {
            width: '300px',
            data: {exercise:exercise}
        });
        dialogRef.afterClosed().subscribe(data => {

            if (data && data.details){
                let copyToDate = moment(data.details.date).format('YYYY-MM-DD');
                let copy = {
                    userid: data.details.userid,
                    exerciseid: data.details.type === "sets" ? data.details.exerciseid : null,
                    type:data.details.type,
                    date: copyToDate,
                    assigneddate: this.selectedDateString
                }   
                
                this.snackBar.open('Copying sets...', '', {
                  duration: 5000
                });  
                
                this.diaryService.copyWorkout(copy).then(() => {
                    this.snackBar.open('Sets copied to ' + moment(copyToDate).format('MMMM Do YYYY') + '!', '', {
                        duration: 5000
                    });  
                    
                    if (copyToDate === this.selectedDateString){
                        this.getWorkout();
                    }
                                       
                }).catch(() => {
                    this.snackBar.open('Failed to copy sets', '', {
                        duration: 5000
                    });                     
                })                      
            }
            
        })     
    }    
    
    
    public addSets(exercise: any): void {
        let dialogRef = this.dialog.open(AddSetComponent, {
            width: '300px',
            data: {exercise:exercise}
        });
        dialogRef.afterClosed().subscribe(data => {

            if (data && data.set){
                let set = data.set;

                let addSet:any = {};
                for (let i = 1; i <= set.multiple; i++) {
                    addSet = {rpe:set.rpe, reps:(set.reps ? set.reps : 0), weight:(set.weight ? set.weight : 0), percentage:set.percentage, unit:set.unit, completed:set.completed};
                    exercise.sets.push(addSet);
                }
                this.cdr.markForCheck();

                // Use addSet with proper parameters (assigneddate and exerciseid via request data)
                const setData = {
                    ...set,
                    assigneddate: this.selectedDateString,
                    exerciseid: exercise.exerciseid
                };
                this.diaryService.addSet(exercise.exerciseid, setData).then((data) => {

                    
                    if (set.multiple === 1){
                        addSet.id = data.id
                        addSet.is_overall_record = data.is_overall_record;
                        this.updateExerciseData(exercise);
                    }
                    else{
                        this.updateSets(exercise); 
                    }
                    
                    // Notify timer service that a set was added
                    this.timerService.setAdded();
                    
                }).catch(() => {
                                    
                });
                
            }
            
        })     
    }
    
    public dropExercise(event: CdkDragDrop<string[]>) {

        moveItemInArray(this.workouts[this.selectedDateString], event.previousIndex, event.currentIndex);

        
        let sets = [];
        let order = 1;
        for (let exercise of this.workouts[this.selectedDateString]){
            for (var index in exercise.sets){
                exercise.sets[index]["exerciseorder"] = order;
                sets.push({id: exercise.sets[index].id, exerciseorder: order});
            }
            order = order + 1;
        }
        
        this.diaryService.reorderExercises(this.selectedDateString, sets).then(()=>{});        
        
        
    }  
    
    public dropSet(event: CdkDragDrop<string[]>, exercise:any) {

        moveItemInArray(exercise.sets, event.previousIndex, event.currentIndex);
        
        let set = 1;
        for (var index in exercise.sets){
            exercise.sets[index]["sets"] = set;
            set = set + 1;
        }
        
        this.diaryService.reorderSets(this.selectedDateString, exercise.exerciseid, exercise.sets).then(() => {});        
        
    }      
    
    
    public editSet(set: any, exercise: any, index: any): void {
        let dialogRef = this.dialog.open(EditSetComponent, {
            width: '400px',
            data: {set:set}
        });
        dialogRef.afterClosed().subscribe(data => {
            if (data && data.delete){
                this.diaryService.deleteSet(set.id).then(() => {
                    this.updateExerciseData(exercise);
                });
                exercise.sets.splice(index,1);
                this.cdr.markForCheck();
            }
            else if (data && data.set){


                Object.assign(set,data.set);
                
                if (data.set.updateAll){
                    data.set.massedit = true;
                    data.set.updateAll = false;
                    delete set.massedit;
                    delete set.updateAll;
                    
                    for (let exerciseSet of exercise.sets){
                        exerciseSet.reps = set.reps;
                        exerciseSet.weight = set.weight;
                    }
                }
                this.cdr.markForCheck();

                this.diaryService.updateSet(set.id, data.set).then((data) => {

                    set.is_overall_record = data.is_overall_record;
                    this.updateExerciseData(exercise);
                });

            }
        })     
    }  
    
    
    public toggleSet(ev: any, set: any, exercise: any): void {
        ev.preventDefault();
        ev.stopPropagation();
        
        if (!set.completed || set.completed === "0"){
            set.completed = true;
        }
        else{
            set.completed = false
        }
        this.cdr.markForCheck();
        
        this.diaryService.updateSet(set.id, set).then(() => {
            this.updateExerciseData(exercise);
        });

        // Notify timer service that a set was toggled/completed
        if (set.completed){
            this.timerService.setAdded();
        }
    }  
    
    public addProgram(): void {
        let dialogRef = this.dialog.open(AddProgramListComponent, {
            width: '600px',
            data: {}
        });
        dialogRef.afterClosed().subscribe(data => {
            
            if (data){
                this.workoutDates = [];
                this.getDiaryData();                 
                this.getWorkout();
            }
        });         
    } 
    
        
    public addExercise(): void {
        let dialogRef = this.dialog.open(AddExerciseComponent, {
            width: '600px',
            data: {}
        });
        dialogRef.afterClosed().subscribe(data => {
            
            if (data && data.exercises){

                this.addExercisesToWorkout(data.exercises);
            
            }
        });         
    }
    
    
   
    
    
    public quickAddExercise(exercise: any): void {
        let addExercise = {name:exercise.name, exerciseid:exercise.exerciseid ? exercise.exerciseid : exercise.id, calibrating:false,addid:null,goals:{goal:1,progress:0},history:[],records:{},sets:[], reps:"",weight:"", unit:false};                   
        this.addExercisesToWorkout([addExercise]);
    }
    
    
    private addExercisesToWorkout(exercises: Array<any>): void {

        for (let exercise of exercises){
            let exists = false;
            for (let workoutExercise of this.workouts[this.selectedDateString]){
                if (workoutExercise["exerciseid"] === exercise["exerciseid"]){
                    exists = true;
                    break;
                }
            }

            if (!exists){        
                
                this.updateExerciseData(exercise);
                
                this.workouts[this.selectedDateString].push(exercise);
                this.cdr.markForCheck();
            }
        }        
    }
    
    
    private updateExerciseData(exercise: any): void {
        exercise["loadingFullData"] = true;
        this.cdr.markForCheck();
        
        this.exerciseService.getExerciseData(exercise["exerciseid"], this.selectedDateString).then((exerciseData:any) => {
            exercise["loadingFullData"] = false;
            exercise["calibrating"] = exerciseData["history"] && exerciseData["history"].length < 1 ? true : false;
            exercise["goals"] = exerciseData["goals"];
            
            // Update history array in place to maintain reference for open dialogs
            if (!exercise["history"]) {
                exercise["history"] = [];
            }
            exercise["history"].length = 0; // Clear existing
            exercise["history"].push(...exerciseData["history"]); // Add new data
            
            exercise["records"] = exerciseData["records"];
            if (exerciseData["reps"] > 0)exercise["reps"] = exerciseData["reps"];
            if (exerciseData["weight"] > 0)exercise["weight"] = exerciseData["weight"];
            exercise["unit"] = exerciseData["unit"] ? exerciseData["unit"] : "kg";
            this.cdr.markForCheck();
        }).catch(() => {
            exercise["loadingFullData"] = false;
            this.cdr.markForCheck();
        });        
    }
    
    
    private updateSets(exercise: any): void {
        this.diaryService.getWorkouts(this.selectedDateString).then((data) => {

            for (let workoutExercise of this.workouts[this.selectedDateString]){
                
                if (workoutExercise.exerciseid === exercise.exerciseid){
                    for (let exerciseData of data) {  
                        if (workoutExercise.exerciseid === exerciseData.exerciseid){
                            workoutExercise["calibrating"] = exerciseData["history"] && exerciseData["history"].length < 1 ? true : false;
                            workoutExercise["goals"] = exerciseData["goals"];
                            workoutExercise["history"] = exerciseData["history"];
                            workoutExercise["records"] = exerciseData["records"];
                            if (exerciseData["reps"] > 0)workoutExercise["reps"] = exerciseData["reps"];
                            if (exerciseData["weight"] > 0)workoutExercise["weight"] = exerciseData["weight"];
                            workoutExercise["unit"] = exerciseData["unit"] ? exerciseData["unit"] : "kg";
                            workoutExercise["sets"] = exerciseData["sets"];

                            break;
                        }
                    }
                }
            }
            this.cdr.markForCheck();
        }).catch(() => {
        })          
    }
    
    /**
     * Merges preloaded workout data (which may contain user changes) with full workout data
     * Preserves user changes like completed sets, modified reps/weight, added/removed sets, etc.
     * Updates objects IN PLACE to maintain references (e.g., for open dialogs)
     */
    private mergeWorkoutData(preloadedData: any[], fullData: any[]): any[] {

        if (!preloadedData || preloadedData.length === 0) {
            return fullData;
        }
        
        if (!fullData || fullData.length === 0) {
            return preloadedData;
        }
        
        // Create a map of full exercises by exerciseid for quick lookup
        const fullDataMap = new Map();
        fullData.forEach(exercise => {
            fullDataMap.set(exercise.exerciseid, exercise);
        });
        
        // Update preloaded exercises IN PLACE with full data
        preloadedData.forEach(preloadedExercise => {
            const fullExercise = fullDataMap.get(preloadedExercise.exerciseid);
            
            if (fullExercise) {
                // Update existing object properties instead of replacing the object
                preloadedExercise.calibrating = fullExercise.calibrating;
                preloadedExercise.goals = fullExercise.goals;
                preloadedExercise.records = fullExercise.records;
                
                // Update history array in place to maintain reference
                if (!preloadedExercise.history) {
                    preloadedExercise.history = [];
                }
                preloadedExercise.history.length = 0; // Clear existing
                preloadedExercise.history.push(...fullExercise.history); // Add new data
                
                // Preserve any additional fields from full data that might be useful
                if (fullExercise.reps && fullExercise.reps > 0) {
                    preloadedExercise.reps = fullExercise.reps;
                }
                if (fullExercise.weight && fullExercise.weight > 0) {
                    preloadedExercise.weight = fullExercise.weight;
                }
                if (fullExercise.unit) {
                    preloadedExercise.unit = fullExercise.unit;
                }
            }
        });
        
        return preloadedData;        
    }
       
    
    public removeExercise(exercise: any, index: any): void {
        let dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '300px',
            data: {
                title:"Remove " + exercise.name + "?", 
                content:"Are you sure you want to remove this exercise? All sets will be removed."
            }
        });
        
        dialogRef.afterClosed().subscribe(result => {
        
            if (result && result.confirm){
                
                if (exercise.sets.length > 0){
                    this.diaryService.deleteExercise(this.selectedDateString, exercise.exerciseid).then(() => {});
                }
                this.workouts[this.selectedDateString].splice(index,1);
                this.cdr.markForCheck();
                
            }
   
        });         
    }
    
    
    private preloadWorkout(): void {
        
        this.loading = true;
        this.cdr.markForCheck();
        
        let selectedDate = this.selectedDateString;
        this.workouts[selectedDate] = [];
        
        this.diaryService.preloadWorkout(selectedDate).then((data) => {
            // Set loading flag for each exercise while full data is being fetched
            for (let exercise of data) {
                exercise.loadingFullData = true;
                // Initialize history array if it doesn't exist so we can update it in place later
                if (!exercise.history) {
                    exercise.history = [];
                }
            }

            this.workouts[selectedDate] = data;
            this.loading = false;
            this.cdr.markForCheck();
        }).catch(() => {
            this.loading = false;
            this.cdr.markForCheck();
        })
    }
    
        
    private getWorkout(): void {
        
        this.loading = true;
        this.cdr.markForCheck();
        
        let selectedDate = this.selectedDateString;
        
        this.diaryService.getWorkouts(selectedDate).then((data) => {

            // Merge the full workout data with any user changes from preloaded data
            
            let currentWorkoutData = this.workouts[selectedDate] || [];

            this.workouts[selectedDate] = this.mergeWorkoutData(currentWorkoutData, data);
            
            // Clear loading flag now that full data is loaded
            for (let exercise of this.workouts[selectedDate]) {
                exercise.loadingFullData = false;
            }
            
            this.loading = false;
            this.cdr.markForCheck();
        }).catch(() => {
            // Clear loading flag on error
            if (this.workouts[selectedDate]) {
                for (let exercise of this.workouts[selectedDate]) {
                    exercise.loadingFullData = false;
                }
            }
            this.loading = false;
            this.cdr.markForCheck();
        })
    }   
    
    private setQuickAddExercises(): void {
        this.exerciseService.getRecentExercises(10).then((data:Array<any>) => {

            if (data.length < 15){
                //fill the rest with recommended exercises
                let recommendedExercises = this.exerciseService.getRecommendedExercises();
                //remove duplicates
                for (let i = recommendedExercises.length - 1; i >= 0; i--) {
                    for (let recentExercise of data){
                        if (recommendedExercises[i].name === recentExercise.name){
                            recommendedExercises.splice(i, 1);
                        }
                    }
                }

                recommendedExercises = recommendedExercises.slice(0, (10 - data.length));
                data = data.concat(recommendedExercises);
            }
            
            this.quickAddExercises = data;
            this.cdr.markForCheck();
        }).catch(() => {
            this.quickAddExercises = this.exerciseService.getRecommendedExercises().slice(0, 10);
            this.cdr.markForCheck();
        })
    } 
    
    
    private monitorSelectedDate(): void {
        this.diaryService.getSelectedDate().subscribe(value => {
            this.selectedDate = moment(value);
            this.selectedDateString = this.selectedDate.format("YYYY-MM-DD");
            this.selectedDateCalendar = this.selectedDate.toDate();
            this.preloadWorkout();
            this.getWorkout();
            
            if (!this.skipWeekdayUpdate){
                //reload the weekdays
                this.isCalendarClick = true;
                this.setWeekdays();
            }
            else{
                //selected from the day nav
                this.setActiveWeekday();
            }
            
        });          
    }
    

    public selectDate(dateObj: any): void {
        this.skipWeekdayUpdate = true;
        this.diaryService.setSelectedDate(dateObj);
    }
    
    
    
    public onCalendarSelect(ev: any): void {
        this.selectedDateCalendar = ev;
        this.isCalendarClick = true;
        this.skipWeekdayUpdate = false; // Force weekday regeneration for calendar clicks
        this.diaryService.setSelectedDate(moment(ev));
    }
    
    
    private setWeekdays(): void {
        this.weekdays = [];
        const today = moment();
        // Generate 50 days before and 50 days after the selected date (total 101 days)
        const daysToGenerate = 101;
        const daysBeforeSelected = 50;
        
        // Start from 50 days before the selected date
        let startDay = moment(this.selectedDate).subtract(daysBeforeSelected, "days");
        
        for (let i = 0; i < daysToGenerate; i++) {
            let currentDay = moment(startDay).clone().add(i, "days");
            let currentDayObj = {
                dayName: currentDay.format("ddd"), 
                day: currentDay.format("D"), 
                moment: moment(currentDay), 
                active: false, 
                hasWorkout: false, 
                isToday: false
            };

            if (currentDay.isSame(this.selectedDate, "day")){
                currentDayObj.active = true;
            }
            
            if (currentDay.isSame(today, "day")){
                currentDayObj.isToday = true;
            }            
            
            if (this.workoutDates.indexOf(currentDay.format("YYYY-MM-DD")) > -1){
                currentDayObj.hasWorkout = true;
            }
            
            this.weekdays.push(currentDayObj);
        }
        
        this.cdr.markForCheck();
        
        // When weekdays are regenerated from calendar click, slide to the new selected date
        if (this.isCalendarClick && this.swiperInstance) {
            setTimeout(() => {
                this.swiperInstance.slideTo(daysBeforeSelected, 300);
                this.isCalendarClick = false; // Reset the flag
            }, 0);
        }
    }
    
    
    private setActiveWeekday(): void {
        for (let day of this.weekdays){
            if (day.moment.isSame(this.selectedDate, "day")){
                day.active = true;
            }
            else{
                day.active = false;
            }            
        }
        this.skipWeekdayUpdate = false;
        this.cdr.markForCheck();
    }
    
    
    private onSlideChange(): void {
        if (!this.swiperInstance) return;
        
        const activeIndex = this.swiperInstance.activeIndex;
        
        // Load more days when approaching the edges
        if (activeIndex < 10) {
            this.loadPreviousDays();
        } else if (activeIndex > this.weekdays.length - 10) {
            this.loadNextDays();
        }
    }
    
    private onSlideChangeTransitionEnd(): void {
        if (!this.swiperInstance) return;
        
        const activeIndex = this.swiperInstance.activeIndex;
        
        // Update selected date when slide transition ends (from swiping or clicking a day)
        if (this.weekdays[activeIndex]) {
            //this.selectDate(this.weekdays[activeIndex].moment);
        }
    }
    
    public onDayClick(index: number): void {
        // Slide to the clicked day
        if (this.swiperInstance) {
            //this.swiperInstance.slideTo(index, 300);
        }      if (this.weekdays[index]) {
            this.selectDate(this.weekdays[index].moment);
        }
        // Date will be selected automatically by onSlideChangeTransitionEnd
    }
    
    private loadPreviousDays(): void {
        const today = moment();
        const firstDay = moment(this.weekdays[0].moment);
        const daysToAdd = 20;
        const newDays = [];
        
        for (let i = daysToAdd; i > 0; i--) {
            let currentDay = moment(firstDay).subtract(i, "days");
            let currentDayObj = {
                dayName: currentDay.format("ddd"), 
                day: currentDay.format("D"), 
                moment: moment(currentDay), 
                active: false, 
                hasWorkout: false, 
                isToday: false
            };
            
            if (currentDay.isSame(this.selectedDate, "day")){
                currentDayObj.active = true;
            }
            
            if (currentDay.isSame(today, "day")){
                currentDayObj.isToday = true;
            }            
            
            if (this.workoutDates.indexOf(currentDay.format("YYYY-MM-DD")) > -1){
                currentDayObj.hasWorkout = true;
            }
            
            newDays.push(currentDayObj);
        }
        
        this.weekdays = [...newDays, ...this.weekdays];
        
        // Adjust the active index to maintain position after adding days to the beginning
        setTimeout(() => {
            if (this.swiperInstance) {
                this.swiperInstance.slideTo(this.swiperInstance.activeIndex + daysToAdd, 0, false);
            }
        }, 0);
        
        this.cdr.markForCheck();
    }
    
    private loadNextDays(): void {
        const today = moment();
        const lastDay = moment(this.weekdays[this.weekdays.length - 1].moment);
        const daysToAdd = 20;
        
        for (let i = 1; i <= daysToAdd; i++) {
            let currentDay = moment(lastDay).add(i, "days");
            let currentDayObj = {
                dayName: currentDay.format("ddd"), 
                day: currentDay.format("D"), 
                moment: moment(currentDay), 
                active: false, 
                hasWorkout: false, 
                isToday: false
            };
            
            if (currentDay.isSame(this.selectedDate, "day")){
                currentDayObj.active = true;
            }
            
            if (currentDay.isSame(today, "day")){
                currentDayObj.isToday = true;
            }            
            
            if (this.workoutDates.indexOf(currentDay.format("YYYY-MM-DD")) > -1){
                currentDayObj.hasWorkout = true;
            }
            
            this.weekdays.push(currentDayObj);
        }
        
        this.cdr.markForCheck();
    }    
    
    
    
    private setWorkoutDates(): void {
        this.diaryService.getWorkoutDates().then((data) => {
            for (let date of data){
                this.workoutDates.push(date.assigneddate);
            }           
            this.minDate = new Date("1970-01-01T00:00:00.000Z"); //used to rerender dateClass
        })        
    }    
    
    
    public dateClass(): MatCalendarCellClassFunction<Date> {
      return (date: Date, view: string): string => {
            let formattedDate = moment(date).format("YYYY-MM-DD");
            if (this.workoutDates.indexOf(formattedDate) > -1) {
                return 'has-workout';
            }
            return '';
      };
    }    
    
    public formatDate(dateString: any): string {
        return moment(dateString).format("dddd, MMMM Do YYYY");
    }
 

}
