import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZoneOptionsComponent } from './zone-options.component';

describe('ZoneOptionsComponent', () => {
  let component: ZoneOptionsComponent;
  let fixture: ComponentFixture<ZoneOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneOptionsComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ZoneOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
