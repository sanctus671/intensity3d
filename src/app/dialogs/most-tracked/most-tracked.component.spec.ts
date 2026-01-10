import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MostTrackedComponent } from './most-tracked.component';

describe('MostTrackedComponent', () => {
  let component: MostTrackedComponent;
  let fixture: ComponentFixture<MostTrackedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MostTrackedComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MostTrackedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
