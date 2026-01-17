import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, CUSTOM_ELEMENTS_SCHEMA, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { register } from 'swiper/element/bundle';

import { ProgramService } from '../../services/program/program.service';
import { AccountService } from '../../services/account/account.service';
import { TranslationService } from '../../services/translation/translation.service';

import { ViewProgramComponent } from '../../dialogs/view-program/view-program.component';
import { AiProgramBuilderComponent } from '../../dialogs/ai-program-builder/ai-program-builder.component';
import { CreateTemplateComponent } from '../../dialogs/create-template/create-template.component';

// Register Swiper custom elements
register();

interface Program {
  id?: string | number;
  programid?: string | number;
  name: string;
  displayName?: string;
  subtitle?: string;
  image?: string;
  duration?: number;
  userid?: string | number;
}

interface ProgramProperties {
  search: string;
  selectedTab: number;
  programLimit: number;
  recentLoading: boolean;
  createdLoading: boolean;
  programsLoading: boolean;
}


@Component({
  selector: 'app-programs',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ProgramsComponent implements OnInit, AfterViewInit {
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private programService = inject(ProgramService);
  private accountService = inject(AccountService);
  private translationService = inject(TranslationService);
  
  public account = signal<any>({});
  public popularPrograms = signal<Program[]>([]);
  public powerliftingPrograms = signal<Program[]>([]);
  public bodybuildingPrograms = signal<Program[]>([]);
  public powerbuildingPrograms = signal<Program[]>([]);
  public weightliftingPrograms = signal<Program[]>([]);
  public strongmanPrograms = signal<Program[]>([]);
  public recentPrograms = signal<Program[]>([]);
  public createdPrograms = signal<Program[]>([]);
  public programs = signal<Program[]>([]);
  public properties = signal<ProgramProperties>({
    search: '',
    selectedTab: 0,
    programLimit: 50,
    recentLoading: true,
    createdLoading: true,
    programsLoading: true
  });
  
  // Computed values for filtered programs
  public filteredRecentPrograms = computed(() => {
    const search = this.properties().search.toLowerCase();
    if (!search) return this.recentPrograms();
    return this.recentPrograms().filter(program => 
      program.name.toLowerCase().includes(search)
    );
  });
  
  public filteredCreatedPrograms = computed(() => {
    const search = this.properties().search.toLowerCase();
    if (!search) return this.createdPrograms();
    return this.createdPrograms().filter(program => 
      program.name.toLowerCase().includes(search)
    );
  });
  
  public filteredPrograms = computed(() => {
    const search = this.properties().search.toLowerCase();
    const limit = this.properties().programLimit;
    let filtered = this.programs();
    
    if (search) {
      filtered = filtered.filter(program => 
        program.name.toLowerCase().includes(search)
      );
    }
    
    return filtered.slice(0, limit);
  });
  
  constructor() {
    // Load account data
    this.accountService.getAccountLocal().then((account: any) => {
      if (account) {
        this.account.set(account);
        this.getPrograms();
      }
    });
    
    // Load static program lists
    this.popularPrograms.set(this.programService.getPopularPrograms());
    this.powerliftingPrograms.set(this.programService.getPowerliftingPrograms());
    this.bodybuildingPrograms.set(this.programService.getBodybuildingPrograms());
    this.powerbuildingPrograms.set(this.programService.getPowerbuildingPrograms());
    this.weightliftingPrograms.set(this.programService.getWeightliftingPrograms());
    this.strongmanPrograms.set(this.programService.getStrongmanPrograms());
  }
  
  ngOnInit(): void {
    // Component initialization
  }
  
  ngAfterViewInit(): void {
    // Swiper initialization happens automatically via custom elements
  }
  
  public viewProgram(program: Program): void {
    const programId = program.id || program.programid;

    console.log(program)
    
    const dialogRef = this.dialog.open(ViewProgramComponent, {
      width: '700px',
      maxWidth: '95vw',
      restoreFocus: false,
      data: { program: { ...program, id: programId } }
    });
    
    dialogRef.afterClosed().subscribe(() => {
      // Handle dialog close if needed
    });
  }
  
  public getPrograms(): void {
    const currentAccount = this.account();
    
    // Get recent programs
    this.programService.getRecentPrograms().then((data: any) => {
      this.properties.update(props => ({ ...props, recentLoading: false }));
      this.recentPrograms.set(data || []);
    }).catch(() => {
      this.properties.update(props => ({ ...props, recentLoading: false }));
    });
    
    // Get created programs
    if (currentAccount?.id) {
      this.programService.getCreatedPrograms(currentAccount.id).then((data: any) => {
        this.properties.update(props => ({ ...props, createdLoading: false }));
        this.createdPrograms.set(data || []);
      }).catch(() => {
        this.properties.update(props => ({ ...props, createdLoading: false }));
      });
    }
    
    // Get all programs
    this.programService.getPrograms().then((data: any) => {
      this.properties.update(props => ({ ...props, programsLoading: false }));
      this.programs.set(data || []);
    }).catch(() => {
      this.properties.update(props => ({ ...props, programsLoading: false }));
    });
  }
  
  public seeMorePrograms(id: string): void {
    const swiperContainer = document.querySelector(`#${id} swiper-container`) as any;
    
    if (swiperContainer?.swiper) {
      if (swiperContainer.swiper.isEnd) {
        swiperContainer.swiper.slideTo(0);
      } else {
        swiperContainer.swiper.slideNext();
      }
    }
  }
  
  public changeTab(index: number): void {
    this.properties.update(props => ({ ...props, selectedTab: index }));
  }
  
  public loadMorePrograms(): void {
    this.properties.update(props => ({ 
      ...props, 
      programLimit: props.programLimit + 50 
    }));
  }
  
  public canLoadMorePrograms(): boolean {
    const props = this.properties();
    const allPrograms = this.programs();
    
    if (props.search) {
      const filtered = allPrograms.filter(item => 
        item.name.toLowerCase().includes(props.search.toLowerCase())
      );
      return filtered.length > props.programLimit;
    }
    
    return allPrograms.length > props.programLimit;
  }
  
  public numberWithCommas(x: number): string {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  public formatDuration(duration: number): string {
    if (duration <= 7) {
      return this.translationService.instant('7 days');
    }
    
    const weeks = Math.round(duration / 7);
    const days = duration % 7;
    
    const weeksText = this.translationService.instant('weeks');
    const daysText = this.translationService.instant('days');
    
    return `${weeks} ${weeksText}${days > 0 ? ` ${days} ${daysText}` : ''}`;
  }
  
  public clearSearch(): void {
    this.properties.update(props => ({ ...props, search: '' }));
  }
  
  public updateSearch(value: string): void {
    this.properties.update(props => ({ ...props, search: value }));
  }
  
  public openAiProgramBuilder(): void {
    const dialogRef = this.dialog.open(AiProgramBuilderComponent, {
      width: '800px',
      maxWidth: '95vw'
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.options) {
        // Handle AI program generation
        this.snackBar.open(
          this.translationService.instant('AI program generation started. This may take a few minutes.'),
          this.translationService.instant('OK'),
          { duration: 5000 }
        );
        // TODO: Implement AI program generation logic
      }
    });
  }
  
  public openCreateTemplate(): void {
    const dialogRef = this.dialog.open(CreateTemplateComponent, {
      width: '700px',
      maxWidth: '95vw'
    });
    
    dialogRef.afterClosed().subscribe((result) => {
      if (result?.program) {
        this.snackBar.open(
          this.translationService.instant('Program template created successfully!'),
          this.translationService.instant('OK'),
          { duration: 3000 }
        );
        
        // Refresh programs list
        this.getPrograms();
        
        // Optionally navigate to view the program
        if (result.view) {
          this.router.navigate(['/programs', result.program.id]);
        }
      }
    });
  }
}
