import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchasePremiumComponent } from './purchase-premium.component';

describe('PurchasePremiumComponent', () => {
  let component: PurchasePremiumComponent;
  let fixture: ComponentFixture<PurchasePremiumComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PurchasePremiumComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchasePremiumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
