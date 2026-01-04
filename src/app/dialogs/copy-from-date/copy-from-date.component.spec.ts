import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CopyFromDateComponent } from './copy-from-date.component';

describe('CopyFromDateComponent', () => {
  let component: CopyFromDateComponent;
  let fixture: ComponentFixture<CopyFromDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CopyFromDateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyFromDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
