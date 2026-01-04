import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyToDateComponent } from './copy-to-date.component';

describe('CopyToDateComponent', () => {
  let component: CopyToDateComponent;
  let fixture: ComponentFixture<CopyToDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyToDateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyToDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
