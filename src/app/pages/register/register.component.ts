import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthenticationService } from '../../services/authentication/authentication.service';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule } from '@ngx-translate/core';
import { LoginContainerComponent } from '../../components/login-container/login-container.component';

interface RegisterFormData {
  email: string;
  password: string;
  confirm_password: string;
}

interface AnonymousAccount {
  username: string;
  password: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    RouterLink,
    TranslateModule,
    LoginContainerComponent
  ]
})
export class RegisterComponent {
  private authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  public loading = signal(false);
  public errors = signal<string[]>([]);

  public async register(formData: RegisterFormData): Promise<void> {
    if (!formData.email || !formData.password || !formData.confirm_password) {
      this.errors.set(['Please fill in all fields']);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      this.errors.set(['Passwords do not match']);
      return;
    }

    this.loading.set(true);
    this.errors.set([]);

    try {
      await this.authenticationService.register(formData.email, formData.password);
      await this.login(formData.email, formData.password);
    } catch (e) {
      this.loading.set(false);
      this.errors.set([typeof e === 'string' ? e : 'Registration failed']);
    }
  }

  public async registerAnonymous(): Promise<void> {
    this.loading.set(true);
    this.errors.set([]);

    try {
      const account = await this.authenticationService.registerAnonymous() as AnonymousAccount;
      
      // Show account credentials to user
      this.snackBar.open(
        `Account created! Email: ${account.username}`,
        'OK',
        { duration: 10000 }
      );

      await this.login(account.username, account.password);
    } catch (e) {
      this.loading.set(false);
      this.errors.set([typeof e === 'string' ? e : 'Failed to create anonymous account']);
    }
  }

  private async login(email: string, password: string): Promise<void> {
    try {
      await this.authenticationService.login(email, password);
      this.loading.set(false);
      this.router.navigate(['']);
    } catch (e) {
      this.loading.set(false);
      this.errors.set(['Login failed after registration']);
    }
  }
}
