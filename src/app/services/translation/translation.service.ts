import { Injectable, signal, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from '../storage/storage.service';
import moment from 'moment';
import 'moment/locale/es';
import 'moment/locale/fr';
import 'moment/locale/de';
import 'moment/locale/it';
import 'moment/locale/pt';
import 'moment/locale/ru';
import 'moment/locale/ja';
import 'moment/locale/ko';
import 'moment/locale/zh-cn';
import 'moment/locale/ar';
import 'moment/locale/hi';
import 'moment/locale/ta';
import 'moment/locale/th';
import 'moment/locale/tr';
import 'moment/locale/nl';
import 'moment/locale/nb';
import 'moment/locale/da';
import 'moment/locale/sv';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ta', name: 'Tamil' },
  { code: 'th', name: 'Thai' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'sv', name: 'Swedish' }
];

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  public currentLanguage = signal<string>('en');
  public supportedLanguages = SUPPORTED_LANGUAGES;

  constructor(
    private translate: TranslateService,
    private storage: StorageService
  ) {
    this.translate.setDefaultLang('en');
    this.initializeLanguage();

    // Effect to persist language changes
    effect(() => {
      const lang = this.currentLanguage();
      this.storage.set('intensity__language', lang);
      // Keep backwards/other-code compatibility (AccountService uses intensity__locale)
      this.storage.set('intensity__locale', lang);
      this.translate.use(lang);
      // Sync Moment.js locale (some languages have different locale codes)
      const momentLocale = this.getMomentLocale(lang);
      moment.locale(momentLocale);
    });
  }

  private async initializeLanguage(): Promise<void> {
    // Load saved language preference
    const savedLanguage = await this.storage.get('intensity__language');
    const savedLocale = savedLanguage ? null : await this.storage.get('intensity__locale');
    
    if (savedLanguage) {
      this.currentLanguage.set(savedLanguage);
    } else if (savedLocale) {
      // Prefer previously-stored account locale if present
      this.currentLanguage.set(savedLocale);
    } else {
      // Auto-detect browser language
      const browserLang = this.translate.getBrowserLang();
      const supportedLangCodes = SUPPORTED_LANGUAGES.map(l => l.code);
      
      if (browserLang && supportedLangCodes.includes(browserLang)) {
        this.currentLanguage.set(browserLang);
      } else {
        this.currentLanguage.set('en');
      }
    }

    this.translate.use(this.currentLanguage());
  }

  public setLanguage(languageCode: string): void {
    if (SUPPORTED_LANGUAGES.some(l => l.code === languageCode)) {
      this.currentLanguage.set(languageCode);
    }
  }

  public getLanguageName(code: string): string {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : code;
  }

  public instant(key: string, params?: any): string {
    return this.translate.instant(key, params);
  }

  public get(key: string, params?: any) {
    return this.translate.get(key, params);
  }

  private getMomentLocale(lang: string): string {
    // Map app language codes to Moment.js locale codes where they differ
    const localeMap: Record<string, string> = {
      'zh': 'zh-cn',
      'no': 'nb'
    };
    return localeMap[lang] || lang;
  }
}
