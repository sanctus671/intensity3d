import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeDistanceUnitsComponent } from './change-distance-units.component';

describe('ChangeDistanceUnitsComponent', () => {
  let component: ChangeDistanceUnitsComponent;
  let fixture: ComponentFixture<ChangeDistanceUnitsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeDistanceUnitsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeDistanceUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
