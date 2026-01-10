import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { RecordsPageComponent } from './records.component';
import { ExerciseService } from '../../services/exercise/exercise.service';

describe('RecordsPageComponent', () => {
  let component: RecordsPageComponent;
  let fixture: ComponentFixture<RecordsPageComponent>;
  let exerciseService: jasmine.SpyObj<ExerciseService>;

  const mockExercises = [
    { id: 1, name: 'Bench Press', category: 'Strength', muscle_group: 'Chest' },
    { id: 2, name: 'Squat', category: 'Strength', muscle_group: 'Legs' },
    { id: 3, name: 'Deadlift', category: 'Strength', muscle_group: 'Back' }
  ];

  beforeEach(async () => {
    const exerciseServiceSpy = jasmine.createSpyObj('ExerciseService', ['getRecentExercises']);
    exerciseServiceSpy.getRecentExercises.and.returnValue(of(mockExercises));

    await TestBed.configureTestingModule({
      imports: [
        RecordsPageComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExerciseService, useValue: exerciseServiceSpy },
        {
          provide: MatDialog,
          useValue: jasmine.createSpyObj('MatDialog', ['open'])
        },
        {
          provide: MatSnackBar,
          useValue: jasmine.createSpyObj('MatSnackBar', ['open'])
        }
      ]
    }).compileComponents();

    exerciseService = TestBed.inject(ExerciseService) as jasmine.SpyObj<ExerciseService>;
    fixture = TestBed.createComponent(RecordsPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load exercises on initialization', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(exerciseService.getRecentExercises).toHaveBeenCalledWith(99);
    expect(component.exercises().length).toBe(3);
    expect(component.isLoading()).toBe(false);
  });

  it('should filter exercises based on search term', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    component.searchTerm.set('bench');
    expect(component.filteredExercises().length).toBe(1);
    expect(component.filteredExercises()[0].name).toBe('Bench Press');
  });

  it('should clear search term', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    
    component.searchTerm.set('bench');
    component.clearSearch();
    expect(component.searchTerm()).toBe('');
  });

  it('should open dialog when selecting an exercise', async () => {
    const dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    fixture.detectChanges();
    await fixture.whenStable();
    
    const exercise = mockExercises[0];
    component.selectExercise(exercise);
    
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should handle error when loading exercises fails', async () => {
    exerciseService.getRecentExercises.and.returnValue(throwError(() => new Error('Load failed')));
    const snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.isLoading()).toBe(false);
    expect(snackBar.open).toHaveBeenCalled();
  });
});
