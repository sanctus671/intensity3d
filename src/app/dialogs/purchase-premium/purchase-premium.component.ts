import { Component, inject, ViewEncapsulation, ViewChild, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { StripeService, StripePaymentElementComponent } from 'ngx-stripe';
import { StripePaymentElementOptions, StripeElementsOptions } from '@stripe/stripe-js';
import { AccountService } from '../../services/account/account.service';
import { ThemeService } from '../../services/theme/theme.service';

interface Account {
  id?: number;
  email?: string;
  premium?: boolean;
}

@Component({
  selector: 'app-purchase-premium',
  templateUrl: './purchase-premium.component.html',
  styleUrls: ['./purchase-premium.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule,
    StripePaymentElementComponent
  ]
})
export class PurchasePremiumComponent implements OnInit {
    
    public dialogRef = inject(MatDialogRef<PurchasePremiumComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private stripeService = inject(StripeService);
    private accountService = inject(AccountService);
    private themeService = inject(ThemeService);
    public snackBar = inject(MatSnackBar);
    
    @ViewChild(StripePaymentElementComponent, {static: false}) paymentElement!: StripePaymentElementComponent;
    
    public account = signal<Account>({});
    public loading = signal<boolean>(false);
    
    paymentElementOptions: StripePaymentElementOptions = {
        layout: {
            type: 'tabs',
            defaultCollapsed: false,
        }
    };  
    
    elementsOptions: StripeElementsOptions = {
        locale: 'en',
        appearance: {
            theme: this.themeService.isDark() ? 'night' : 'stripe',
        },
        mode: 'payment',
        amount: 3499, // $34.99 in cents
        currency: 'usd',
    };
    
    constructor() {
        this.loadAccount();
        
        // Update payment element styling when theme changes
        effect(() => {
            const isDark = this.themeService.isDark();
            this.elementsOptions = {
                locale: 'en',
                appearance: {
                    theme: isDark ? 'night' : 'stripe',
                },
                mode: 'payment',
                amount: 3499,
                currency: 'usd',
            };
        });
    }
    
    ngOnInit(): void {
        // Disable CDK's native Popover API so Stripe Link modal appears above this dialog.
        // The popover attribute puts dialogs in the browser's "top layer" which blocks external overlays.
        setTimeout(() => this.disablePopoverForDialog(), 0);
    }
    
    private disablePopoverForDialog(): void {
        document.querySelectorAll('.cdk-overlay-popover').forEach(el => {
            el.removeAttribute('popover');
        });
    }
      
    private async loadAccount(): Promise<void> {
        try {
            const account = await this.accountService.getAccountLocal();
            if (account) {
                this.account.set(account);
            }
        } catch (error) {
            console.error('Error loading account:', error);
        }
    }
 
    public async purchase(form: any): Promise<void> {
        this.loading.set(true);
        
        try {
            const result = await this.stripeService.confirmPayment({
                elements: this.paymentElement.elements,
                confirmParams: {
                    return_url: window.location.origin + '/premium?payment_success=true',
                    payment_method_data: {
                        billing_details: {
                            name: form.cardholder,
                            email: this.account().email
                        }
                    }
                },
                redirect: 'if_required'
            }).toPromise();

            if (result?.error) {
                this.loading.set(false);
                this.snackBar.open(result.error.message || 'There was an error with your payment.', '', {
                    duration: 5000
                });
            } else if (result?.paymentIntent) {
                // Payment succeeded
                const billingInfo = {
                    id: result.paymentIntent.id, 
                    email: this.account().email, 
                    name: form.cardholder
                };
                
                await this.accountService.purchasePremium(billingInfo);
                this.loading.set(false);
                this.dialogRef.close(true);
            }
        } catch (error) {
            this.loading.set(false);
            this.snackBar.open('There was an error making payment.', '', {
                duration: 5000
            });
        }
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
