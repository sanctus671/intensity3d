import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FatigueOptionsComponent } from './fatigue-options.component';

describe('FatigueOptionsComponent', () => {
  let component: FatigueOptionsComponent;
  let fixture: ComponentFixture<FatigueOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FatigueOptionsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FatigueOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
