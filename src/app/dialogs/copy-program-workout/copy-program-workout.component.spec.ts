import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyProgramWorkoutComponent } from './copy-program-workout.component';

describe('CopyProgramWorkoutComponent', () => {
  let component: CopyProgramWorkoutComponent;
  let fixture: ComponentFixture<CopyProgramWorkoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyProgramWorkoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyProgramWorkoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
