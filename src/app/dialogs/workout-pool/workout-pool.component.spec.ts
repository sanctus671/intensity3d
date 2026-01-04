import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkoutPoolComponent } from './workout-pool.component';

describe('WorkoutPoolComponent', () => {
  let component: WorkoutPoolComponent;
  let fixture: ComponentFixture<WorkoutPoolComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WorkoutPoolComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkoutPoolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
