import { Component, signal, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';
import { Subscription } from 'rxjs';
import moment from 'moment';

interface Account {
  dp: string;
  premium: boolean;
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthenticationService);
  private accountService = inject(AccountService);
  private diaryService = inject(DiaryService);
  public themeService = inject(ThemeService);
  private router = inject(Router);
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  
  sidenavOpened = signal(false);
  selectedDate = signal(new Date());
  account = signal<Account>({
    dp: 'http://api.intensityapp.com/uploads/default.png',
    premium: false
  });

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
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
        this.cdr.markForCheck();
      }
    });
    this.subscriptions.push(accountSub);

    // Subscribe to diary date changes
    const diarySub = this.diaryService.getDiaryObservable().subscribe((date) => {
      if (date) {
        this.selectedDate.set(new Date(date));
      }
    });
    this.subscriptions.push(diarySub);

    // Register custom SVG icons
    this.matIconRegistry.addSvgIcon(
      'trophy',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/md-trophy.svg')
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getSelectedMonth(): string {
    const date = this.selectedDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
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
    if (this.router.url !== '/diary') {
      this.router.navigate(['/diary']);
    }
  }

  menuChanged(opened: boolean): void {
    this.sidenavOpened.set(opened);
  }

  toggleMenu(): void {
    this.sidenavOpened.update(value => !value);
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
}
