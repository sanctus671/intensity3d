import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalSettingsComponent } from './goal-settings.component';

describe('GoalSettingsComponent', () => {
  let component: GoalSettingsComponent;
  let fixture: ComponentFixture<GoalSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GoalSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
