import { Component, OnInit, NgZone, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { Router, RouterLink } from '@angular/router';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { LoginContainerComponent } from '../../components/login-container/login-container.component';

declare var FB: any;

interface LoginFormData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink,
    TranslateModule,
    LoginContainerComponent
  ]
})
export class LoginComponent implements OnInit {
  private authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  private ngZone = inject(NgZone);

  public loading = signal(false);
  public fbLoading = signal(false);
  public appleLoading = signal(false);
  public errors = signal<string[]>([]);

  constructor() {
    this.matIconRegistry.addSvgIcon(
      'facebook',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/facebook.svg')
    );
    this.matIconRegistry.addSvgIcon(
      'apple',
      this.domSanitizer.bypassSecurityTrustResourceUrl('assets/apple.svg')
    );
  }

  ngOnInit(): void {
    this.initializeFacebookSDK();
    this.initializeAppleSDK();
  }

  private initializeFacebookSDK(): void {
    (window as any).fbAsyncInit = function() {
      FB.init({
        appId: '414561158706027',
        cookie: true,
        xfbml: true,
        version: 'v3.3'
      });
    };

    (function(d, s, id) {
      const fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      const js = d.createElement(s) as HTMLScriptElement;
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js';
      fjs.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  public async login(formData: LoginFormData): Promise<void> {
    if (!formData.email || !formData.password) {
      this.errors.set(['Please enter both email and password']);
      return;
    }

    this.loading.set(true);
    this.errors.set([]);

    try {
      await this.authenticationService.login(formData.email, formData.password);
      this.loading.set(false);
      this.router.navigate(['']);
    } catch (e) {
      this.loading.set(false);
      this.errors.set(['Incorrect email or password']);
    }
  }

  public fbLogin(): void {
    this.fbLoading.set(true);
    this.errors.set([]);

    FB.login((response: any) => {
      if (response.authResponse) {
        const userId = response.authResponse.userID;
        FB.api(userId + '/?fields=id,email,name', ['email'], (apiResponse: any) => {
          if (apiResponse.error) {
            this.ngZone.run(() => {
              this.fbLoading.set(false);
              this.errors.set([apiResponse.error.message]);
            });
          } else {
            this.authenticationService.loginFb(apiResponse)
              .then(() => {
                this.ngZone.run(() => {
                  this.fbLoading.set(false);
                  this.router.navigate(['']);
                });
              })
              .catch(() => {
                this.ngZone.run(() => {
                  this.fbLoading.set(false);
                  this.errors.set(['Failed to login with Facebook']);
                });
              });
          }
        });
      } else {
        this.ngZone.run(() => {
          this.fbLoading.set(false);
          this.errors.set(['Failed to login with Facebook']);
        });
      }
    }, { scope: 'email' });
  }

  private initializeAppleSDK(): void {
    // Load Apple Sign In script
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js';
    script.async = true;
    document.head.appendChild(script);
  }

  public appleLogin(): void {
    this.appleLoading.set(true);
    this.errors.set([]);

    // Check if AppleID is available
    if (!(window as any).AppleID) {
      this.ngZone.run(() => {
        this.appleLoading.set(false);
        this.errors.set(['Apple Sign In is not available']);
      });
      return;
    }

    (window as any).AppleID.auth.init({
      clientId: 'service.web.com.taylorhamling.intensity', // TODO: Replace with your Apple Client ID
      scope: 'name email',
      redirectURI: window.location.origin,
      usePopup: true
    });

    (window as any).AppleID.auth.signIn()
      .then((response: any) => {
        const { authorization, user } = response;
        
        // Construct profile object
        const profile = {
          id: authorization.id_token, // Use the ID token as unique identifier
          email: user?.email || '',
          name: user?.name ? `${user.name.firstName} ${user.name.lastName}` : ''
        };

        this.authenticationService.loginApple(profile)
          .then(() => {
            this.ngZone.run(() => {
              this.appleLoading.set(false);
              this.router.navigate(['']);
            });
          })
          .catch(() => {
            this.ngZone.run(() => {
              this.appleLoading.set(false);
              this.errors.set(['Failed to login with Apple']);
            });
          });
      })
      .catch((error: any) => {
        this.ngZone.run(() => {
          this.appleLoading.set(false);
          if (error.error !== 'popup_closed_by_user') {
            this.errors.set(['Failed to login with Apple']);
          }
        });
      });
  }
}
