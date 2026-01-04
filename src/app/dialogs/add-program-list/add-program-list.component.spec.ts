import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProgramListComponent } from './add-program-list.component';

describe('AddProgramListComponent', () => {
  let component: AddProgramListComponent;
  let fixture: ComponentFixture<AddProgramListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddProgramListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddProgramListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
