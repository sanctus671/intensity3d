import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewSetComponent } from './view-set.component';

describe('ViewSetComponent', () => {
  let component: ViewSetComponent;
  let fixture: ComponentFixture<ViewSetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewSetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewSetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
