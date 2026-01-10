import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

import { AccountService } from '../../services/account/account.service';
import { TranslationService } from '../../services/translation/translation.service';
import { PremiumComponent } from '../../pages/premium/premium.component';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * AI Program Builder Modal Component
 * 
 * This component provides a user interface for creating personalized workout programs
 * using AI assistance. It supports two modes:
 * 
 * 1. Guided Mode: Structured form with predefined options for:
 *    - Training Goal (Strength, Hypertrophy, Peaking, General Fitness)
 *    - Experience Level (Beginner, Intermediate, Advanced)
 *    - Training Days per Week (3-6 days)
 *    - Available Equipment (Full Gym, Home Gym, Minimal Equipment)
 *      - Equipment Description (required for Home Gym/Minimal Equipment)
 *    - Extra Options (toggle):
 *      - Focus Lift/Emphasis (Squat, Bench, Deadlift, Overhead Press, Balanced)
 *      - Block Length (4-20 weeks)
 *      - Session Length (Short ~45min, Medium ~60-75min, Long 90+min)
 *      - Injury/Limitations (optional checkbox with freeform text)
 * 
 * 2. Advanced Mode: Freeform text input for custom program descriptions
 * 
 * Usage:
 * ```typescript
 * const modal = await this.modalController.create({
 *   component: AiProgramBuilderComponent
 * });
 * modal.present();
 * 
 * const { data, role } = await modal.onWillDismiss();
 * if (data && data.program) {
 *   // Handle generated program
 * }
 * ```
 * 
 * Returns:
 * - data.program: Generated program object with workouts and exercises
 * - data.options: User's input options (guided or advanced)
 */
export interface ProgramBuilderOptions {
  mode: 'guided' | 'advanced';
  guidedOptions?: {
    goal: string;
    experience: string;
    trainingDays: number;
    equipment: string;
    equipmentDescription?: string;
    extraOptions?: {
      focusLift: string;
      blockLength: number;
      sessionLength: string;
      hasInjuryLimitations: boolean;
      injuryLimitations: string;
    };
  };
  advancedPrompt?: string;
}

@Component({
  selector: 'app-ai-program-builder',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatButtonToggleModule,
    MatDividerModule,
    TranslateModule
  ],
  templateUrl: './ai-program-builder.component.html',
  styleUrls: ['./ai-program-builder.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiProgramBuilderComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<AiProgramBuilderComponent>);
  private accountService = inject(AccountService);
  private translationService = inject(TranslationService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  
  public user = signal<any>({});
  public mode = signal<'guided' | 'advanced'>('guided');
  public guidedOptions = signal({
    goal: 'strength',
    experience: 'intermediate',
    trainingDays: 3,
    equipment: 'full_gym',
    equipmentDescription: '',
    extraOptions: {
      focusLift: 'balanced',
      blockLength: 1,
      sessionLength: 'medium',
      hasInjuryLimitations: false,
      injuryLimitations: ''
    }
  });
  public advancedPrompt = signal<string>('');
  public isLoading = signal<boolean>(false);
  public showExtraOptions = signal<boolean>(false);

  // Mock data for dropdowns
  public goals = [
    { value: 'strength', label: 'Strength' },
    { value: 'hypertrophy', label: 'Hypertrophy' },
    { value: 'peaking', label: 'Peaking' },
    { value: 'general_fitness', label: 'General Fitness' }
  ];

  public experienceLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  public equipmentOptions = [
    { value: 'full_gym', label: 'Full Gym' },
    { value: 'home_gym', label: 'Home Gym' },
    { value: 'minimal_equipment', label: 'Minimal Equipment' }
  ];

  public trainingDaysOptions = [3, 4, 5, 6];

  // Extra options data
  public focusLiftOptions = [
    { value: 'squat', label: 'Squat' },
    { value: 'bench', label: 'Bench Press' },
    { value: 'deadlift', label: 'Deadlift' },
    { value: 'overhead_press', label: 'Overhead Press' },
    { value: 'balanced', label: 'Balanced' }
  ];

  public blockLengthOptions = [1, 4, 6, 8, 10, 12];

  public sessionLengthOptions = [
    { value: 'short', label: 'Short (~45 min)' },
    { value: 'medium', label: 'Medium (~60-75 min)' },
    { value: 'long', label: 'Long (90+ min)' }
  ];

  constructor() {
    // Load account data
    this.accountService.getAccountLocal().then((account: any) => {
      if (account) {
        this.user.set(account);
      }
    });
    
    // Subscribe to account updates
    this.accountService.getAccountObservable().subscribe((account: any) => {
      if (account && account.id) {
        this.user.set(account);
      }
    });
  }

  ngOnInit(): void {
    // Component initialization - defaults already set in signal initialization
  }

  public switchMode(newMode: 'guided' | 'advanced'): void {
    this.mode.set(newMode);
  }

  public toggleExtraOptions(): void {
    this.showExtraOptions.update(value => !value);
  }

  private openPremium(): void {
    const dialogRef = this.dialog.open(PremiumComponent, {
      width: '800px',
      maxWidth: '95vw',
      data: { account: this.user() }
    });
    
    dialogRef.afterClosed().subscribe(() => {
      // Refresh user data after premium dialog closes
      this.accountService.getAccountLocal().then((account: any) => {
        if (account) {
          this.user.set(account);
        }
      });
    });
  }
  

  public generateProgram(): void {
    const currentUser = this.user();
    
    if (!currentUser.premium) {
      this.openPremium();
      return;
    }

    // Validate inputs based on mode
    const currentMode = this.mode();
    const currentGuidedOptions = this.guidedOptions();
    const currentAdvancedPrompt = this.advancedPrompt();
    
    if (currentMode === 'guided') {
      if (!currentGuidedOptions.goal || !currentGuidedOptions.experience || !currentGuidedOptions.equipment) {
        this.showValidationError('Please fill in all required fields.');
        return;
      }
      
      if (this.needsEquipmentDescription() && !currentGuidedOptions.equipmentDescription.trim()) {
        this.showValidationError('Please describe your available equipment.');
        return;
      }
    } else {
      if (!currentAdvancedPrompt.trim()) {
        this.showValidationError('Please enter a description for your program.');
        return;
      }
    }

    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: {
        title: this.translationService.instant('Generate Program'),
        content: this.translationService.instant('AI program generation can take several minutes. Please be patient and do not close the app while generating your program.')
      }
    });
    
    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result || !result.confirm) {
        return;
      }

      this.isLoading.set(true);

      try {
        const options: ProgramBuilderOptions = {
          mode: currentMode,
          ...(currentMode === 'guided' 
            ? { guidedOptions: currentGuidedOptions } 
            : { advancedPrompt: currentAdvancedPrompt }
          ),
        };

        this.dialogRef.close({ options });
      } catch (error) {
        this.showError('Failed to generate program. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  public cancel(): void {
    this.dialogRef.close();
  }

  private showValidationError(message: string): void {
    this.snackBar.open(
      this.translationService.instant(message),
      this.translationService.instant('OK'),
      { duration: 5000 }
    );
  }

  private showError(message: string): void {
    this.snackBar.open(
      this.translationService.instant(message),
      this.translationService.instant('OK'),
      { duration: 5000 }
    );
  }

  // Helper methods for template
  public isGuidedMode(): boolean {
    return this.mode() === 'guided';
  }

  public isAdvancedMode(): boolean {
    return this.mode() === 'advanced';
  }

  public canGenerate(): boolean {
    const currentMode = this.mode();
    const currentGuidedOptions = this.guidedOptions();
    const currentAdvancedPrompt = this.advancedPrompt();
    const currentShowExtraOptions = this.showExtraOptions();
    
    if (currentMode === 'guided') {
      const hasBasicOptions = !!(currentGuidedOptions.goal && currentGuidedOptions.experience && currentGuidedOptions.equipment);
      const hasValidEquipmentDescription = this.needsEquipmentDescription() ? !!currentGuidedOptions.equipmentDescription.trim() : true;
      const hasValidExtraOptions = !currentShowExtraOptions || (
        !!currentGuidedOptions.extraOptions.focusLift && 
        !!currentGuidedOptions.extraOptions.sessionLength &&
        (!currentGuidedOptions.extraOptions.hasInjuryLimitations || !!currentGuidedOptions.extraOptions.injuryLimitations.trim())
      );
      return hasBasicOptions && hasValidEquipmentDescription && hasValidExtraOptions;
    } else {
      return !!currentAdvancedPrompt.trim();
    }
  }

  // Helper methods for template
  public getGoalLabel(): string {
    const currentOptions = this.guidedOptions();
    return this.goals.find(g => g.value === currentOptions.goal)?.label || '';
  }

  public getExperienceLabel(): string {
    const currentOptions = this.guidedOptions();
    return this.experienceLevels.find(e => e.value === currentOptions.experience)?.label || '';
  }

  public getEquipmentLabel(): string {
    const currentOptions = this.guidedOptions();
    return this.equipmentOptions.find(e => e.value === currentOptions.equipment)?.label || '';
  }

  public getFocusLiftLabel(): string {
    const currentOptions = this.guidedOptions();
    return this.focusLiftOptions.find(f => f.value === currentOptions.extraOptions.focusLift)?.label || '';
  }

  public getSessionLengthLabel(): string {
    const currentOptions = this.guidedOptions();
    return this.sessionLengthOptions.find(s => s.value === currentOptions.extraOptions.sessionLength)?.label || '';
  }

  public needsEquipmentDescription(): boolean {
    const currentOptions = this.guidedOptions();
    return currentOptions.equipment === 'home_gym' || currentOptions.equipment === 'minimal_equipment';
  }
  
  public updateGuidedOption(field: string, value: any): void {
    const current = this.guidedOptions();
    this.guidedOptions.set({ ...current, [field]: value });
  }
  
  public updateExtraOption(field: string, value: any): void {
    const current = this.guidedOptions();
    this.guidedOptions.set({
      ...current,
      extraOptions: { ...current.extraOptions, [field]: value }
    });
  }
}
