import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageProgramComponent } from './manage-program.component';

describe('ManageProgramComponent', () => {
  let component: ManageProgramComponent;
  let fixture: ComponentFixture<ManageProgramComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageProgramComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
