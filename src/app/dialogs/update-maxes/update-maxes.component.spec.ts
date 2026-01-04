import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateMaxesComponent } from './update-maxes.component';

describe('UpdateMaxesComponent', () => {
  let component: UpdateMaxesComponent;
  let fixture: ComponentFixture<UpdateMaxesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateMaxesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateMaxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
