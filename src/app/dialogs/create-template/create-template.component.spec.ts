import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController, Platform } from '@ionic/angular';
import { CreateTemplateComponent } from './create-template.component';
import { ProgramService } from 'src/app/services/program/program.service';
import { DiaryService } from 'src/app/services/diary/diary.service';
import { AccountService } from 'src/app/services/account/account.service';
import { TranslateService } from '@ngx-translate/core';

// Mocks
class MockProgramService {}
class MockDiaryService {}
class MockAccountService { getAccount = () => Promise.resolve({ username: 'testuser' }); }
class MockTranslateService { getDefaultLang = () => 'en'; }
class MockModalController { dismiss = jasmine.createSpy('dismiss'); }
class MockPlatform { is = () => false; }

describe('CreateTemplateComponent', () => {
  let component: CreateTemplateComponent;
  let fixture: ComponentFixture<CreateTemplateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CreateTemplateComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: ProgramService, useClass: MockProgramService },
        { provide: DiaryService, useClass: MockDiaryService },
        { provide: AccountService, useClass: MockAccountService },
        { provide: TranslateService, useClass: MockTranslateService },
        { provide: ModalController, useClass: MockModalController },
        { provide: Platform, useClass: MockPlatform },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have required methods', () => {
    expect(typeof component.formatDate).toBe('function');
    expect(typeof component.getTotalDays).toBe('function');
    expect(typeof component.generate).toBe('function');
    expect(typeof component.dismiss).toBe('function');
    expect(typeof component.selectStartDate).toBe('function');
    expect(typeof component.selectEndDate).toBe('function');
  });
});
