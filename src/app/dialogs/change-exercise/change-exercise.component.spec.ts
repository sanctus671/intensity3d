import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeExerciseComponent } from './change-exercise.component';

describe('ChangeExerciseComponent', () => {
  let component: ChangeExerciseComponent;
  let fixture: ComponentFixture<ChangeExerciseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeExerciseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
