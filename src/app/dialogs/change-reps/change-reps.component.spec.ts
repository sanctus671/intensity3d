import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeRepsComponent } from './change-reps.component';

describe('ChangeRepsComponent', () => {
  let component: ChangeRepsComponent;
  let fixture: ComponentFixture<ChangeRepsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeRepsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeRepsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
