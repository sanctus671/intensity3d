import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditProgramExerciseComponent } from './edit-program-exercise.component';

describe('EditProgramExerciseComponent', () => {
  let component: EditProgramExerciseComponent;
  let fixture: ComponentFixture<EditProgramExerciseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditProgramExerciseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditProgramExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
