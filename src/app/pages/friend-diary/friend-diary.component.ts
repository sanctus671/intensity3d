import { Component, OnInit, ViewEncapsulation, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCalendarCellClassFunction } from '@angular/material/datepicker';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';
import moment from 'moment';

import { DiaryService } from '../../services/diary/diary.service';
import { AccountService } from '../../services/account/account.service';
import { FriendsService } from '../../services/friends/friends.service';
import { ThemeService } from '../../services/theme/theme.service';
import { environment } from '../../../environments/environment';

import { CopyToDateComponent } from '../../dialogs/copy-to-date/copy-to-date.component';
import { ShareComponent } from '../../dialogs/share/share.component';
import { GoalsComponent } from '../../dialogs/goals/goals.component';
import { ViewSetComponent } from '../../dialogs/view-set/view-set.component';

@Component({
  selector: 'app-friend-diary',
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './friend-diary.component.html',
  styleUrls: ['./friend-diary.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FriendDiaryComponent implements OnInit {
    private diaryService = inject(DiaryService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private route = inject(ActivatedRoute);
    private accountService = inject(AccountService);
    private friendsService = inject(FriendsService);
    private matIconRegistry = inject(MatIconRegistry);
    private domSanitizer = inject(DomSanitizer);
    translate = inject(TranslateService);
    themeService = inject(ThemeService);
    
    // Signals
    selectedDate = signal<any>(moment());
    selectedDateString = signal<string>(moment().format('YYYY-MM-DD'));
    workouts = signal<any>({});
    loading = signal<boolean>(false);
    selectedDateCalendar = signal<Date>(new Date());
    weekdays = signal<Array<any>>([]);
    skipWeekdayUpdate = signal<boolean>(false);
    account = signal<any>({});
    friendId = signal<any>(null);
    friendProfile = signal<any>({});
    workoutDates = signal<string[]>([]);
    minDate = signal<Date | null>(null);

    constructor() {
        // Register custom SVG icon
        this.matIconRegistry.addSvgIcon(
            'diary-empty',
            this.domSanitizer.bypassSecurityTrustResourceUrl('assets/icon/diaryempty.svg')
        );
        
        this.initializeComponent();
    }
    
    private async initializeComponent() {
        // Get account data
        try {
            const account = await this.accountService.getAccount();
            this.account.set(account);
        } catch (error) {
            console.error('Error loading account:', error);
        }
        
        // Get route parameters
        const date = this.route.snapshot.params['date'];
        const userId = this.route.snapshot.params['userid'];
        
        this.friendId.set(userId);
        
        // Load friend profile data
        if (userId) {
            try {
                const friendData = await this.friendsService.getFriend(userId);
                this.friendProfile.set(friendData);
            } catch (error) {
                console.error('Error loading friend profile:', error);
            }
        }
        
        if (date) {
            this.diaryService.setSelectedDate(moment(date));
        }
        
        // Load workout dates for calendar
        await this.loadWorkoutDates();
        
        this.monitorSelectedDate();
    }

    ngOnInit() {
        // Initialization logic handled in constructor
    } 
    

    
    public openGoals(exercise: any) {
        this.dialog.open(GoalsComponent, {
            width: '400px',
            data: { exercise: exercise },
            autoFocus: false
        });         
    }
    
    public shareExercise(exercise: any) {
        const selectedDateString = this.selectedDateString();
        const workouts = this.workouts();
        const selectedDate = this.selectedDate();
        
        this.dialog.open(ShareComponent, {
            width: '600px',
            data: { 
                workout: workouts[selectedDateString], 
                exercise: exercise, 
                shareType: "workout", 
                title: "Intensity Workout - " + selectedDate.format('dddd, MMMM Do YYYY')
            }
        });   
    }     
    
    public viewSet(set: any, exercise: any) {
        this.dialog.open(ViewSetComponent, {
            width: '400px',
            data: { set: set, exercise: exercise }
        });   
    }      

    
    public copyExercise(exercise: any) {
        const dialogRef = this.dialog.open(CopyToDateComponent, {
            width: '300px',
            data: { exercise: exercise }
        });
        
        dialogRef.afterClosed().subscribe(async (data: any) => {
            if (data && data.details) {
                const copyToDate = moment(data.details.date).format('YYYY-MM-DD');
                const copy = {
                    userid: this.friendId(),
                    exerciseid: data.details.type === "sets" ? data.details.exerciseid : null,
                    type: data.details.type,
                    date: copyToDate,
                    assigneddate: this.selectedDateString()
                };
                
                this.snackBar.open(
                    this.translate.instant('Copying sets...'), 
                    '', 
                    { duration: 5000 }
                );  
                
                try {
                    await this.diaryService.copyWorkout(copy);
                    this.snackBar.open(
                        this.translate.instant('Sets copied to') + ' ' + moment(copyToDate).format('MMMM Do YYYY') + '!', 
                        '', 
                        { duration: 5000 }
                    );
                } catch (error) {
                    this.snackBar.open(
                        this.translate.instant('Failed to copy sets'), 
                        '', 
                        { duration: 5000 }
                    );
                }
            }
        });     
    }    


    
    private async getWorkout() {
        this.loading.set(true);
        
        const selectedDateString = this.selectedDateString();
        const friendId = this.friendId();
        const currentWorkouts = this.workouts();
        currentWorkouts[selectedDateString] = [];
        this.workouts.set({ ...currentWorkouts });
        
        try {
            const data = await this.friendsService.getFriendDiary(friendId, selectedDateString);
            const updatedWorkouts = this.workouts();
            updatedWorkouts[selectedDateString] = data;
            this.workouts.set({ ...updatedWorkouts });
        } catch (error) {
            console.error('Error loading workout:', error);
        } finally {
            this.loading.set(false);
        }
    }   

    
    private monitorSelectedDate() {
        this.diaryService.getSelectedDate().subscribe(value => {
            const selectedDate = moment(value);
            this.selectedDate.set(selectedDate);
            this.selectedDateString.set(selectedDate.format("YYYY-MM-DD"));
            this.selectedDateCalendar.set(selectedDate.toDate());
            this.getWorkout();
            
            if (!this.skipWeekdayUpdate()) {
                // Reload the weekdays
                this.setWeekdays();
            } else {
                // Selected from the day nav
                this.setActiveWeekday();
            }
        });          
    }
    
    public selectDate(dateObj: any) {
        this.skipWeekdayUpdate.set(true);
        this.diaryService.setSelectedDate(dateObj);
    }
    
    public onCalendarSelect(ev: any) {
        this.selectedDateCalendar.set(ev);
        this.diaryService.setSelectedDate(moment(ev));
    }
    
    
    private setWeekdays() {
        const newWeekdays = [];
        const selectedDate = this.selectedDate();
        const dates = this.workoutDates();
        let currentDay = moment(selectedDate);
        const today = moment();
        
        for (let i = 0; i < 7; i++) {
            const currentDayObj = {
                dayName: currentDay.format("ddd"), 
                day: currentDay.format("D"), 
                moment: moment(currentDay), 
                active: false, 
                hasWorkout: false, 
                isToday: false
            };

            if (currentDay.isSame(selectedDate, "day")) {
                currentDayObj.active = true;
            }
            
            if (currentDay.isSame(today, "day")) {
                currentDayObj.isToday = true;
            }
            
            // Check if this day has a workout
            if (dates.indexOf(currentDay.format("YYYY-MM-DD")) > -1) {
                currentDayObj.hasWorkout = true;
            }
            
            newWeekdays.push(currentDayObj);
            currentDay = moment(currentDay).add(1, "days");
        }
        
        this.weekdays.set(newWeekdays);
    }
    
    private setActiveWeekday() {
        const currentWeekdays = this.weekdays();
        const selectedDate = this.selectedDate();
        
        const updatedWeekdays = currentWeekdays.map(day => ({
            ...day,
            active: day.moment.isSame(selectedDate, "day")
        }));
        
        this.weekdays.set(updatedWeekdays);
        this.skipWeekdayUpdate.set(false);
    }
    
    public formatDate(dateString: string) {
        return moment(dateString).format("dddd, MMMM Do YYYY");
    }
    
    public formatName(item: any): string {
        if (!item) return '';
        let name = item.display ? item.display : item.username;
        if (!name) return '';
        name = name.split("@")[0]; 
        return name;      
    }
    
    public getDp(dp: string): string {
        if (!dp) {
            return 'https://api.intensityapp.com/uploads/default.png';
        }
        if (dp.startsWith('http')) {
            return dp;
        }
        return environment.apiUrl.replace('index.php', '') + dp;
    }
    
    private async loadWorkoutDates() {
        const friendId = this.friendId();
        if (!friendId) return;
        
        try {
            const response: any = await this.friendsService.getFriendWorkoutDates(friendId);
            console.log(response);
            if (response) {
                const dates = response.map((dateObj: any) => dateObj.assigneddate);
                this.workoutDates.set(dates);
         
                
                // Force calendar to re-render dateClass
                this.minDate.set(new Date("1970-01-01T00:00:00.000Z"));
                
                // Update weekdays to show workout indicators
                const currentWeekdays = this.weekdays();
                if (currentWeekdays.length > 0) {
                    const updatedWeekdays = currentWeekdays.map(day => ({
                        ...day,
                        hasWorkout: dates.indexOf(day.moment.format("YYYY-MM-DD")) > -1
                    }));
                    this.weekdays.set(updatedWeekdays);
                }
            }
        } catch (error) {
            console.error('Error loading workout dates:', error);
        }
    }
    
    public dateClass = (): MatCalendarCellClassFunction<Date> => {
        return (date: Date, view: string): string => {
            const formattedDate = moment(date).format("YYYY-MM-DD");
            const dates = this.workoutDates();
            if (dates.indexOf(formattedDate) > -1) {
                return 'has-workout';
            }
            return '';
        };
    };
}
