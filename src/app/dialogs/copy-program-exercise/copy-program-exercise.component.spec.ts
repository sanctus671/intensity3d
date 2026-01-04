import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyProgramExerciseComponent } from './copy-program-exercise.component';

describe('CopyProgramExerciseComponent', () => {
  let component: CopyProgramExerciseComponent;
  let fixture: ComponentFixture<CopyProgramExerciseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyProgramExerciseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyProgramExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
