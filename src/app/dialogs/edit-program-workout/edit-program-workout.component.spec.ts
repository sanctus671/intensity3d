import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProgramWorkoutComponent } from './edit-program-workout.component';

describe('EditProgramWorkoutComponent', () => {
  let component: EditProgramWorkoutComponent;
  let fixture: ComponentFixture<EditProgramWorkoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditProgramWorkoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProgramWorkoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
