import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPremiumComponent } from './view-premium.component';

describe('ViewPremiumComponent', () => {
  let component: ViewPremiumComponent;
  let fixture: ComponentFixture<ViewPremiumComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewPremiumComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewPremiumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
