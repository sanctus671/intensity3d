import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LoginContainerComponent } from '../../components/login-container/login-container.component';

interface ForgotPasswordFormData {
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    RouterLink,
    TranslateModule,
    LoginContainerComponent
  ]
})
export class ForgotPasswordComponent {
  private authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private translate = inject(TranslateService);

  public loading = signal(false);
  public errors = signal<string[]>([]);

  public async resetPassword(formData: ForgotPasswordFormData): Promise<void> {
    if (!formData.email) {
      this.errors.set(['Please enter your email address']);
      return;
    }

    this.loading.set(true);
    this.errors.set([]);

    try {
      await this.authenticationService.resetPassword(formData.email);
      this.loading.set(false);
      
      this.snackBar.open(
        this.translate.instant('Recovery email sent!'),
        '',
        { duration: 5000 }
      );
      
      this.router.navigate(['/login']);
    } catch (e) {
      this.loading.set(false);
      this.errors.set([typeof e === 'string' ? e : 'Failed to send recovery email']);
    }
  }
}
