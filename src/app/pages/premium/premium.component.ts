import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { StripeService } from 'ngx-stripe';

import { AccountService } from '../../services/account/account.service';
import { DisplayInformationComponent } from '../../dialogs/display-information/display-information.component';
import { PurchasePremiumComponent } from '../../dialogs/purchase-premium/purchase-premium.component';

interface Account {
  id?: number;
  email?: string;
  premium?: boolean;
}

@Component({
  selector: 'app-premium',
  templateUrl: './premium.component.html',
  styleUrls: ['./premium.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatButtonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    TranslateModule
  ]
})
export class PremiumComponent implements OnInit {
  private accountService = inject(AccountService);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private stripeService = inject(StripeService);
  
  public account = signal<Account>({});
  
  constructor() {
    this.loadAccount();
  }
  
  ngOnInit(): void {
    // Check if user was redirected back after 3D Secure authentication
    this.route.queryParams.subscribe(async params => {
      if (params['payment_success'] === 'true') {
        const paymentIntentClientSecret = params['payment_intent_client_secret'];
        
        // Remove query parameters from URL
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
        
        if (paymentIntentClientSecret) {
          // Payment Intent exists, need to retrieve it and update account
          try {
            const result = await this.stripeService.retrievePaymentIntent(paymentIntentClientSecret).toPromise();
            
            if (result?.paymentIntent && result.paymentIntent.status === 'succeeded') {
              // Update account with payment info
              const account = await this.accountService.getAccountLocal();
              const billingInfo = {
                id: result.paymentIntent.id,
                email: account?.email,
                name: (result.paymentIntent as any).charges?.data?.[0]?.billing_details?.name || ''
              };
              
              await this.accountService.purchasePremium(billingInfo);
            }
          } catch (error) {
            console.error('Error processing payment intent:', error);
          }
        }
        
        // Refresh account data and show success message
        await this.accountService.getAccount();
        this.loadAccount();
        
        setTimeout(() => {
          this.dialog.open(DisplayInformationComponent, {
            width: '300px',
            data: {
              title: 'Thank You!',
              content: 'Your payment was successful and premium has now been activated on your account.'
            },
            autoFocus: false
          }).afterClosed().subscribe(() => {
            this.router.navigate(['/diary']);
          });
        }, 200);
      }
    });
  }
  
  private async loadAccount(): Promise<void> {
    try {
      const account = await this.accountService.getAccountLocal();
      if (account) {
        this.account.set(account);
        
        if (account.premium) {
          this.dialog.open(DisplayInformationComponent, {
            width: '300px',
            data: {
              title: 'Premium Purchased',
              content: 'You have already purchased premium! You do not need to upgrade again. If you are having issues with your account, please contact support@intensityapp.com'
            },
            autoFocus: false
          });
        }
      }
    } catch (error) {
      console.error('Error loading account:', error);
    }
  }
  
  public purchasePremium(): void {
    const dialogRef = this.dialog.open(PurchasePremiumComponent, {
      width: '400px',
      data: {},
      autoFocus: false
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh account data
        this.accountService.getAccount().then(() => {
          this.loadAccount();
        });
        
        setTimeout(() => {
          const successDialog = this.dialog.open(DisplayInformationComponent, {
            width: '300px',
            data: {
              title: 'Thank You!',
              content: 'Your payment was successful and premium has now been activated on your account.'
            },
            autoFocus: false
          });
          
          successDialog.afterClosed().subscribe(() => {
            if (this.router.url === '/premium') {
              this.router.navigate(['/diary']);
            }
          });
        }, 200);
      }
    });
  }
}
