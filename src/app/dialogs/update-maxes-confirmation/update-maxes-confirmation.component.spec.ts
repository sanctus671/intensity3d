import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateMaxesConfirmationComponent } from './update-maxes-confirmation.component';

describe('UpdateMaxesConfirmationComponent', () => {
  let component: UpdateMaxesConfirmationComponent;
  let fixture: ComponentFixture<UpdateMaxesConfirmationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateMaxesConfirmationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateMaxesConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
