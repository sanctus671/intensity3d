import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { PremiumComponent } from './premium.component';
import { AccountService } from '../../services/account/account.service';

describe('PremiumComponent', () => {
  let component: PremiumComponent;
  let fixture: ComponentFixture<PremiumComponent>;
  let mockAccountService: jasmine.SpyObj<AccountService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockAccountService = jasmine.createSpyObj('AccountService', [
      'getAccountLocal',
      'getAccount'
    ]);
    mockAccountService.getAccountLocal.and.returnValue(Promise.resolve({}));
    
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [
        PremiumComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideAnimationsAsync(),
        { provide: AccountService, useValue: mockAccountService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PremiumComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load account on initialization', async () => {
    await fixture.whenStable();
    expect(mockAccountService.getAccountLocal).toHaveBeenCalled();
  });

  it('should open purchase dialog when purchasePremium is called', () => {
    component.purchasePremium();
    expect(mockDialog.open).toHaveBeenCalled();
  });
});
