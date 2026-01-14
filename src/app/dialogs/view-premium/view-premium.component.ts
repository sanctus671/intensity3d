import { Component, inject, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AccountService } from '../../services/account/account.service';
import { PremiumComponent } from '../../pages/premium/premium.component';

@Component({
  selector: 'app-view-premium',
  templateUrl: './view-premium.component.html',
  styleUrls: ['./view-premium.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    TranslateModule,
    PremiumComponent
  ]
})
export class ViewPremiumComponent implements OnDestroy {
    
    public dialogRef = inject(MatDialogRef<ViewPremiumComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    private accountSubscription: Subscription;

    constructor() {
        this.accountSubscription = this.accountService.getAccountObservable().subscribe(account => {
            if (account?.premium) {
                this.dialogRef.close(true);
            }
        });         
    }

    ngOnDestroy(): void {
        this.accountSubscription?.unsubscribe();
    }

    public dismiss(): void { 
        this.dialogRef.close();
    }
}
