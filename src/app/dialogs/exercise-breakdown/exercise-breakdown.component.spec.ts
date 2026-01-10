import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExerciseBreakdownComponent } from './exercise-breakdown.component';

describe('ExerciseBreakdownComponent', () => {
  let component: ExerciseBreakdownComponent;
  let fixture: ComponentFixture<ExerciseBreakdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciseBreakdownComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseBreakdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
