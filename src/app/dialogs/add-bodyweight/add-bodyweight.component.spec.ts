import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddBodyweightComponent } from './add-bodyweight.component';

describe('AddBodyweightComponent', () => {
  let component: AddBodyweightComponent;
  let fixture: ComponentFixture<AddBodyweightComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddBodyweightComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddBodyweightComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
