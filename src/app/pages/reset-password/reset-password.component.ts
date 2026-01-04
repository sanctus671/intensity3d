import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { LoginContainerComponent } from '../../components/login-container/login-container.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    RouterLink,
    TranslateModule,
    LoginContainerComponent
  ]
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  
  public token = signal<string | null>(null);

  ngOnInit(): void {
    const tokenParam = this.route.snapshot.paramMap.get('token');
    this.token.set(tokenParam);
    
    // TODO: Implement token-based password reset API call when backend is ready
    // For now, this is just a confirmation page
  }
}
