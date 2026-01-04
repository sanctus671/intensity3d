import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalResetsComponent } from './goal-resets.component';

describe('GoalResetsComponent', () => {
  let component: GoalResetsComponent;
  let fixture: ComponentFixture<GoalResetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GoalResetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GoalResetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
