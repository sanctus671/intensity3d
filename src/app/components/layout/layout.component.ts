import { Component, signal, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import { ThemeService } from '../../services/theme/theme.service';
import { TranslationService } from '../../services/translation/translation.service';
import { TimerService } from '../../services/timer/timer.service';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';
import { TimerComponent } from '../../dialogs/timer/timer.component';
import { PlateCalculatorComponent } from '../../dialogs/tools/plate-calculator/plate-calculator.component';
import { WarmupCalculatorComponent } from '../../dialogs/tools/warmup-calculator/warmup-calculator.component';
import { OnermCalculatorComponent } from '../../dialogs/tools/onerm-calculator/onerm-calculator.component';
import { PointsCalculatorComponent } from '../../dialogs/tools/points-calculator/points-calculator.component';
import { WeightConverterComponent } from '../../dialogs/tools/weight-converter/weight-converter.component';
import { ViewPremiumComponent } from '../../dialogs/view-premium/view-premium.component';
import { Subscription } from 'rxjs';
import moment from 'moment';
import { environment } from '../../../environments/environment';

interface Account {
  id?: number;
  dp: string;
  premium: boolean;
  display?: string;
  username?: string;
  email?: string;
}

interface UserStats {
  current_streak: number;
  last_workout: string | null;
  loading: boolean;
}

@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.light-theme]': '!themeService.isDark()',
    '[class.dark-theme]': 'themeService.isDark()'
  }
})
export class LayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthenticationService);
  private accountService = inject(AccountService);
  private diaryService = inject(DiaryService);
  public themeService = inject(ThemeService);
  public timerService = inject(TimerService);
  // Injected to ensure saved language is applied on app boot (including hard refresh on /diary)
  private translationService = inject(TranslationService);
  private router = inject(Router);
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  constructor(){
    
    this.matIconRegistry.addSvgIcon(
        'plates',
        this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/icon/platesicon.svg')
      );
  }
  
  timerStatus = signal<{
    stopwatchStarted: boolean;
    countdownTimerStarted: boolean;
    intervalStarted: boolean;
  }>({
    stopwatchStarted: false,
    countdownTimerStarted: false,
    intervalStarted: false
  });
  
  sidenavOpened = signal(false);
  selectedDate = signal(new Date());
  account = signal<Account>({
    dp: 'http://api.intensityapp.com/uploads/default.png',
    premium: false
  });
  userStats = signal<UserStats>({
    current_streak: 0,
    last_workout: null,
    loading: true
  });
  
  currentRoute = signal<string>('');
  friendUserId = signal<string | null>(null);
  
  // Computed property to determine the diary link
  diaryLink = computed(() => {
    const userId = this.friendUserId();
    return userId ? `/friends/${userId}/diary` : '/diary';
  });

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    // Track current route to detect if we're on friend diary
    const routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentRoute.set(event.url);
        this.updateFriendUserId(event.url);
      }
    });
    this.subscriptions.push(routerSub);
    
    // Initialize with current route
    this.currentRoute.set(this.router.url);
    this.updateFriendUserId(this.router.url);
    
    // Load account data
    this.accountService.getAccount().then((data) => {

      if (data) {
        this.account.set(data);
        this.cdr.markForCheck();
      }
    }).catch((error) => {
   
      // The getAccount method already tries to load from cache, but we can try again
      this.accountService.getAccountLocal().then((localData) => {
     
        if (localData) {
          this.account.set(localData);
          this.cdr.markForCheck();
        }
      }).catch(() => {

      });
    });

    // Subscribe to account updates
    const accountSub = this.accountService.getAccountObservable().subscribe((user) => {
      if (user) {
        this.account.set(user);
        // If the account has a locale, ensure the app uses it (survives reloads)
        if (user?.locale && user.locale !== this.translationService.currentLanguage()) {
          this.translationService.setLanguage(user.locale);
        }
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.push(accountSub);

    // Load user stats
    this.loadUserStats();

    // Subscribe to diary date changes
    const diarySub = this.diaryService.getSelectedDate().subscribe((date) => {
      if (date) {
  
        this.selectedDate.set(date.toDate());
      }
    });
    this.subscriptions.push(diarySub);

    // Register custom SVG icons


    // Subscribe to timer status
    const timerSub = this.timerService.timerStatusObservable.subscribe((data: any) => {
      if (data) {
        this.timerStatus.set(data);
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.push(timerSub);

    // Subscribe to counter for continuous UI updates when any timer is running
    const counterSub = this.timerService.counter.subscribe(() => {
      // Only trigger change detection if at least one timer is running
      if (this.timerStatus().stopwatchStarted || 
          this.timerStatus().countdownTimerStarted || 
          this.timerStatus().intervalStarted) {
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.push(counterSub);

  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getSelectedMonth(): string {
    const date = this.selectedDate();
    return moment(date).format('MMMM YYYY');
  }

  getTodayFormatted(): string {
    return moment().format('MMMM D, YYYY');
  }

  setToday(): void {
    const today = moment();
    this.selectedDate.set(today.toDate());
    this.diaryService.setSelectedDate(today);
    this.navigateToDiary();
  }

  changeWeek(direction: string): void {
    const currentDate = moment(this.selectedDate());
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    
    if (direction === 'left') {
      // Go back 7 days
      currentDate.subtract(7, 'days');
    } else {
      // Go forward 7 days
      currentDate.add(7, 'days');
    }
    
    this.selectedDate.set(currentDate.toDate());
    this.diaryService.setSelectedDate(currentDate);
    this.navigateToDiary();
  }

  navigateToDiary(): void {
    const userId = this.friendUserId();
    const targetLink = this.diaryLink();
    
    // Only navigate if not already on the correct page
    if (!this.router.url.startsWith(targetLink.split('?')[0])) {
      this.router.navigate([targetLink]);
    }
  }
  
  updateFriendUserId(url: string): void {
    // Check if we're on a friend diary page: /friends/:userid/diary
    const friendDiaryMatch = url.match(/^\/friends\/(\d+)\/diary/);
    if (friendDiaryMatch) {
      this.friendUserId.set(friendDiaryMatch[1]);
    } else {
      this.friendUserId.set(null);
    }
  }

  menuChanged(opened: boolean): void {
    this.sidenavOpened.set(opened);
  }

  toggleMenu(): void {
    this.sidenavOpened.update(value => !value);
  }

  openTimer(): void {
    this.dialog.open(TimerComponent, {
      width: '400px',
      maxWidth: '95vw',
      panelClass: 'timer-dialog-container'
    });
  }

  getStopwatchTime(): string {
    return this.timerService.formatNavTime(this.timerService.stopwatchDuration);
  }

  getTimerTime(): string {
    return this.timerService.formatNavTime(this.timerService.countdownTimerDuration);
  }

  logout(): void {
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '300px',
      data: {
        title: 'Logout',
        content: 'Are you sure you want to logout?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.confirm) {
        this.authService.logout().then(() => {
          this.router.navigate(['/login']);
        }).catch(() => {
          // Even if logout fails, navigate to login
          this.router.navigate(['/login']);
        });
      }
    });
  }

  openPlateCalculator(): void {
    this.dialog.open(PlateCalculatorComponent, {
      width: '400px',
      maxWidth: '95vw',
      panelClass: 'plate-calculator-dialog-container'
    });
  }

  openWarmupCalculator(): void {
    this.dialog.open(WarmupCalculatorComponent, {
      width: '550px',
      maxWidth: '95vw',
      panelClass: 'warmup-calculator-dialog-container'
    });
  }

  openOnermCalculator(): void {
    this.dialog.open(OnermCalculatorComponent, {
      width: '350px',
      maxWidth: '95vw',
      panelClass: 'onerm-calculator-dialog-container'
    });
  }

  openPointsCalculator(): void {
    this.dialog.open(PointsCalculatorComponent, {
      width: '450px',
      maxWidth: '95vw',
      panelClass: 'points-calculator-dialog-container'
    });
  }

  openWeightConverter(): void {
    this.dialog.open(WeightConverterComponent, {
      width: '400px',
      maxWidth: '95vw',
      panelClass: 'weight-converter-dialog-container'
    });
  }

  loadUserStats(): void {
    this.diaryService.getStats({ type: 'generaluserdata' }).then((data: any) => {
      const stats: UserStats = {
        current_streak: data.current_streak || 0,
        last_workout: data.heatmap && data.heatmap.length > 0 ? data.heatmap[0].assigneddate : null,
        loading: false
      };
      this.userStats.set(stats);
      this.cdr.markForCheck();
    }).catch(() => {
      this.userStats.update(stats => ({ ...stats, loading: false }));
      this.cdr.markForCheck();
    });
  }

  formatUserName(): string {
    const user = this.account();
    if (!user) return '';
    let name = user.display || user.username || '';
    if (!name) return '';
    return name.split('@')[0];
  }

  formatLastWorkout(): string {
    const lastWorkout = this.userStats().last_workout;
    if (!lastWorkout) return 'Never';
    
    const workoutDate = moment(lastWorkout);
    const today = moment().startOf('day');
    const yesterday = moment().subtract(1, 'day').startOf('day');
    
    if (workoutDate.isSame(today, 'day')) {
      return 'Today';
    } else if (workoutDate.isSame(yesterday, 'day')) {
      return 'Yesterday';
    } else if (workoutDate.isAfter(moment().subtract(7, 'days'))) {
      return workoutDate.format('dddd');
    } else {
      return workoutDate.format('MMMM D, YYYY');
    }
  }

  getDp(): string {
    const user = this.account();
    if (!user || !user.dp){
        return 'https://api.intensityapp.com/uploads/default.png';
    }
    if (user?.dp.startsWith('http')) return user?.dp;
    return environment.apiUrl.replace('index.php', '') + user?.dp; 
  }

  openUpgrade(): void {
    const dialogRef = this.dialog.open(ViewPremiumComponent, {
      width: '550px',
      maxWidth: '95vw',
      panelClass: 'view-premium-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Premium status was updated, reload user stats
        this.loadUserStats();
      }
    });
  }

  navigateToProfile(): void {
    // Pass the already-loaded account data to the profile component
    // so it can display immediately without waiting for a full reload
    this.router.navigate(['/profile'], {
      state: {
        account: this.account()
      }
    });
  }
}
