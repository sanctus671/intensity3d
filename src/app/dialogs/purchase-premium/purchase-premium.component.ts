import { Component, inject, ViewEncapsulation, ViewChild } from '@angular/core';
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
import { StripeService, StripeCardComponent } from 'ngx-stripe';
import { StripeCardElementOptions, StripeElementsOptions } from '@stripe/stripe-js';
import { AccountService } from '../../services/account/account.service';

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
    StripeCardComponent
  ]
})
export class PurchasePremiumComponent {
    
    public dialogRef = inject(MatDialogRef<PurchasePremiumComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private stripeService = inject(StripeService);
    private accountService = inject(AccountService);
    public snackBar = inject(MatSnackBar);
    
    @ViewChild(StripeCardComponent, {static: false}) card!: StripeCardComponent;
    
    cardOptions: StripeCardElementOptions = {
        style: {
            base: {
                iconColor: '#000000',
                color: '#000000',
                lineHeight: '40px',
                fontWeight: '400',
                fontFamily: 'Roboto, "Helvetica Neue", sans-serif',
                fontSize: '16px',
                '::placeholder': {
                  color: 'rgba(0, 0, 0, 0.54)'
              }
            }
        }
    };  
    
    elementsOptions: StripeElementsOptions = {
        locale: 'en'
    };     
    
    public account: any;
    public loading: boolean = false;
    
    constructor() {
        this.account = {};

        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
        });
    }
 
    public purchase(form: any): void {
        this.loading = true;
        this.stripeService
          .createToken(this.card.element, { name: form.cardholder })
          .subscribe(result => {
            if (result.token) {
                let subscriptionData = {
                    id: result.token.id, 
                    email: this.account.email, 
                    name: form.cardholder
                };
                
                // Note: purchasePremium method needs to be implemented in AccountService
                this.accountService.updateAccount(subscriptionData).then((data) => {
                    this.loading = false;
                    this.dialogRef.close(true);
                }).catch(() => {
                    this.loading = false;
                    this.snackBar.open('There was an error making payment.', '', {
                        duration: 5000
                    });                     
                })

            } else if (result.error) {
                this.loading = false;
                this.snackBar.open('There was an error with your card.', '', {
                    duration: 5000
                });                 
            }
          });          
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
