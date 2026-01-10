import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaderboardExerciseComponent } from './leaderboard-exercise.component';

describe('LeaderboardExerciseComponent', () => {
  let component: LeaderboardExerciseComponent;
  let fixture: ComponentFixture<LeaderboardExerciseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaderboardExerciseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaderboardExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
