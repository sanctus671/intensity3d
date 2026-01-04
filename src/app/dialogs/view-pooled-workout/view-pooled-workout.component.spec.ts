import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPooledWorkoutComponent } from './view-pooled-workout.component';

describe('ViewPooledWorkoutComponent', () => {
  let component: ViewPooledWorkoutComponent;
  let fixture: ComponentFixture<ViewPooledWorkoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewPooledWorkoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewPooledWorkoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
