import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewProgramDetailsComponent } from './view-program-details.component';

describe('ViewProgramDetailsComponent', () => {
  let component: ViewProgramDetailsComponent;
  let fixture: ComponentFixture<ViewProgramDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewProgramDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewProgramDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
