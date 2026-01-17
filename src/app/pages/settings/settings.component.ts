import { Component, OnInit, signal, inject, ChangeDetectionStrategy, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { AuthenticationService } from '../../services/authentication/authentication.service';
import { AccountService } from '../../services/account/account.service';
import { DiaryService } from '../../services/diary/diary.service';
import { ThemeService, Theme } from '../../services/theme/theme.service';
import { TranslationService, SUPPORTED_LANGUAGES } from '../../services/translation/translation.service';

import { ChangePasswordComponent } from '../../dialogs/change-password/change-password.component';
import { ChangeEmailComponent } from '../../dialogs/change-email/change-email.component';
import { GoalSettingsComponent } from '../../dialogs/goal-settings/goal-settings.component';
import { ChangeUnitsComponent } from '../../dialogs/change-units/change-units.component';
import { ChangeDistanceUnitsComponent } from '../../dialogs/change-distance-units/change-distance-units.component';
import { ImportComponent } from '../../dialogs/import/import.component';
import { ConfirmationComponent } from '../../dialogs/confirmation/confirmation.component';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    TranslateModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private router = inject(Router);
    private accountService = inject(AccountService);
    private authenticationService = inject(AuthenticationService);
    private diaryService = inject(DiaryService);
    public themeService = inject(ThemeService);
    private translationService = inject(TranslationService);
    private cdr = inject(ChangeDetectorRef);
    
    public account = signal<any>({});
    public exportLoading = signal<boolean>(false);
    public units = signal<any>({});
    public supportedLanguages = SUPPORTED_LANGUAGES;
    public version = '3.0.0';
    
    // Getter/setter for theme to work with ngModel
    get selectedTheme(): Theme {
        return this.themeService.currentTheme();
    }
    
    set selectedTheme(value: Theme) {
        this.themeService.setTheme(value);
    }
    
    // Getter/setter for language to work with ngModel
    get selectedLanguage(): string {
        return this.translationService.currentLanguage();
    }
    
    set selectedLanguage(value: string) {
        this.translationService.setLanguage(value);
    }
    
    constructor() {
        // Watch for theme changes and trigger change detection
        effect(() => {
            this.themeService.currentTheme();
            this.cdr.markForCheck();
        });
        
        // Watch for language changes and trigger change detection
        effect(() => {
            this.translationService.currentLanguage();
            this.cdr.markForCheck();
        });
        
        // Load account data
        this.accountService.getAccountLocal().then((account: any) => {
            if (account) {
                this.account.set(account);
                this.units.set({
                    units: account.units || 'kg',
                    distanceunits: account.distanceunits || 'cm'
                });
            }
        });
        
        // Subscribe to account updates
        this.accountService.getAccountObservable().subscribe((account: any) => {
            if (account) {
                this.account.set(account);
                this.units.set({
                    units: account.units || 'kg',
                    distanceunits: account.distanceunits || 'cm'
                });
            }
        });
    }
    
    public updateSettings(): void {
        const currentAccount = this.account();
        this.accountService.updateSettings({
            autocomplete: currentAccount.autocomplete,
            leaderboard: currentAccount.leaderboard,
            intensity_scale: currentAccount.intensity_scale
        }, currentAccount.id).then(() => {
            this.accountService.setAccountObservable(currentAccount);
            this.snackBar.open(this.translationService.instant('Settings updated'), '', {
                duration: 3000
            });
        }).catch(() => {
            this.snackBar.open(this.translationService.instant('Error updating settings'), '', {
                duration: 3000
            });
        });
    }
    
    public onThemeChange(): void {
        // Theme is already set via the setter
        this.snackBar.open(this.translationService.instant('Theme updated'), '', {
            duration: 2000
        });
    }
    
    public onLanguageChange(): void {
        console.log("here");
        // Language is already set via the setter
        const currentAccount = this.account();
        
        // Update account locale
        this.accountService.updateSettings({
            locale: this.selectedLanguage
        }, currentAccount.id).then(() => {
            // Persist locally so it survives refresh/offline and can be applied at boot
            const nextAccount = { ...currentAccount, locale: this.selectedLanguage };
            this.account.set(nextAccount);
            this.accountService.setLocale(this.selectedLanguage);
            this.accountService.setAccountObservable(nextAccount);
            this.snackBar.open(this.translationService.instant('Language updated'), '', {
                duration: 2000
            });
        }).catch(() => {
            this.snackBar.open(this.translationService.instant('Error updating language'), '', {
                duration: 3000
            });
        });
    }
    
    public openGoalSettings(): void {
        const dialogRef = this.dialog.open(GoalSettingsComponent, {
            width: '400px',
            data: {}
        });  
        dialogRef.afterClosed().subscribe(data => {
            // Handle dialog close if needed
        });
    }      
    
    
    public exportData(): void {
        this.exportLoading.set(true);
        const currentAccount = this.account();
        
        this.diaryService.exportDiary(currentAccount.id).then((data: any) => {
            this.exportLoading.set(false);
            window.open("http://api.intensityapp.com/" + data, '_system');
            this.snackBar.open(this.translationService.instant('Export downloading'), '', {
                duration: 5000
            });              
        }).catch(() => {
            this.exportLoading.set(false);
            this.snackBar.open(this.translationService.instant('Error exporting data'), '', {
                duration: 3000
            });
        });
    }
    
    public importData(): void {
        const dialogRef = this.dialog.open(ImportComponent, {
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            data: {}
        });  
        dialogRef.afterClosed().subscribe(data => {
            if (data && data.file) {
                this.snackBar.open(this.translationService.instant('Importing data...'), '', {
                    duration: 60000
                });
                const currentAccount = this.account();
                this.diaryService.importDiary(data.file, currentAccount.id, data.type).then(() => {
                    this.snackBar.open(this.translationService.instant('Data imported'), '', {
                        duration: 5000
                    });                    
                }).catch(() => {
                    this.snackBar.open(this.translationService.instant('Error importing data'), '', {
                        duration: 3000
                    });
                });
            }
        });
    }    
    
    
    public openChangeUnits(): void {
        const dialogRef = this.dialog.open(ChangeUnitsComponent, {
            width: '400px',
            data: {}
        });  
        dialogRef.afterClosed().subscribe(data => {
            const currentAccount = this.account();
            const currentUnits = this.units();
            
            if (data) {
                currentAccount.units = currentUnits.units;

                this.accountService.updateSettings({
                    units: currentAccount.units,
                    applytoall: data.applytoall,
                    applyconvert: data.applyconvert
                }, currentAccount.id).then(() => {
                    this.accountService.setAccountObservable(currentAccount);
                    this.snackBar.open(this.translationService.instant('Units updated'), '', {
                        duration: 5000
                    });                     
                }).catch(() => {
                    this.snackBar.open(this.translationService.instant('Error updating units'), '', {
                        duration: 3000
                    });
                });
            } else {
                this.units.set({
                    ...currentUnits,
                    units: currentAccount.units
                });
            }              
        });
    }
    
    public openChangeDistanceUnits(): void {
        const dialogRef = this.dialog.open(ChangeDistanceUnitsComponent, {
            width: '400px',
            data: {}
        });  
        dialogRef.afterClosed().subscribe(data => {
            const currentAccount = this.account();
            const currentUnits = this.units();
            
            if (data) {
                currentAccount.distanceunits = currentUnits.distanceunits;

                this.accountService.updateSettings({
                    distanceunits: currentAccount.distanceunits,
                    applytoall: data.applytoall
                }, currentAccount.id).then(() => {
                    this.accountService.setAccountObservable(currentAccount);
                    this.snackBar.open(this.translationService.instant('Distance units updated'), '', {
                        duration: 5000
                    });                     
                }).catch(() => {
                    this.snackBar.open(this.translationService.instant('Error updating distance units'), '', {
                        duration: 3000
                    });
                });
            } else {
                this.units.set({
                    ...currentUnits,
                    distanceunits: currentAccount.distanceunits
                });
            }             
        });
    }    
    
    
    public changePassword(): void {
        const dialogRef = this.dialog.open(ChangePasswordComponent, {
            width: '400px',
            data: {}
        });  
        dialogRef.afterClosed().subscribe(data => {
            if (data.new_password && data.confirm_password) {
                if (data.new_password !== data.confirm_password) {
                    this.snackBar.open(this.translationService.instant('Passwords do not match'), '', {
                        duration: 5000
                    });                     
                    return;
                }
                
                const currentAccount = this.account();
                this.authenticationService.changePassword(data.new_password, currentAccount.id).then(() => {
                    this.snackBar.open(this.translationService.instant('Password changed'), '', {
                        duration: 5000
                    });                     
                }).catch(() => {
                    this.snackBar.open(this.translationService.instant('Error changing password'), '', {
                        duration: 5000
                    });                    
                });
            }   
        });         
    }
    
    public changeEmail(): void {
        const currentAccount = this.account();
        const dialogRef = this.dialog.open(ChangeEmailComponent, {
            width: '400px',
            data: { email: currentAccount.email }
        });  
        dialogRef.afterClosed().subscribe(data => {
            if (data?.new_email && data?.confirm_email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(data.new_email)) {
                    this.snackBar.open(this.translationService.instant('Please enter a valid email address'), '', {
                        duration: 5000
                    });                     
                    return;
                }
                
      
                
                const currentAccount = this.account();
                this.authenticationService.changeEmail(data.new_email, currentAccount.id).then(() => {
                    this.snackBar.open(this.translationService.instant('Email changed'), '', {
                        duration: 5000
                    });                     
                }).catch(() => {
                    this.snackBar.open(this.translationService.instant('Error changing email'), '', {
                        duration: 5000
                    });                    
                });
            }   
        });         
    }
    
    public deleteAccount(): void {
        // Show confirmation dialog
        const confirmMessage = this.translationService.instant('All your account data will be removed. This cannot be undone. Are you sure you want to continue?');
        
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '400px',
            maxWidth: '95vw',
            data: {
                title: this.translationService.instant('Delete Account'),
                content: confirmMessage
            }
        });
        
        dialogRef.afterClosed().subscribe((result) => {
            if (result && result.confirm) {
                this.authenticationService.deleteAccount().then(() => {
                    this.snackBar.open(this.translationService.instant('Account deleted'), '', {
                        duration: 3000
                    });
                    // Redirect to login page
                    this.router.navigate(['/login']);
                }).catch(() => {
                    this.snackBar.open(this.translationService.instant('Error deleting account'), '', {
                        duration: 3000
                    });
                });
            }
        });
    }
    
    public logout(): void {
        const dialogRef = this.dialog.open(ConfirmationComponent, {
            width: '300px',
            data: {
                title: this.translationService.instant('Logout'),
                content: this.translationService.instant('Are you sure you want to logout?')
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.confirm) {
                this.authenticationService.logout().then(() => {
                    this.snackBar.open(this.translationService.instant('Logged out'), '', {
                        duration: 2000
                    });
                    this.router.navigate(['/login']);
                }).catch(() => {
                    // Even if logout fails, navigate to login
                    this.router.navigate(['/login']);
                });
            }
        });
    }
    
    public onUnitsChange(value: string): void {
        const currentUnits = this.units();
        this.units.set({ ...currentUnits, units: value });
        this.openChangeUnits();
    }
    
    public onDistanceUnitsChange(value: string): void {
        const currentUnits = this.units();
        this.units.set({ ...currentUnits, distanceunits: value });
        this.openChangeDistanceUnits();
    }
    
    public onAutocompleteChange(value: boolean): void {
        const currentAccount = this.account();
        this.account.set({ ...currentAccount, autocomplete: value });
        this.updateSettings();
    }
    
    public onLeaderboardChange(value: boolean): void {
        const currentAccount = this.account();
        this.account.set({ ...currentAccount, leaderboard: value });
        this.updateSettings();
    }
    
    public onIntensityScaleChange(value: string): void {
        const currentAccount = this.account();
        this.account.set({ ...currentAccount, intensity_scale: value });
        this.updateSettings();
    }

    ngOnInit(): void {
        // Component initialization
    }
}
