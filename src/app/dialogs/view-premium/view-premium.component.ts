import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';

@Component({
  selector: 'app-view-premium',
  templateUrl: './view-premium.component.html',
  styleUrls: ['./view-premium.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    TranslateModule
  ]
})
export class ViewPremiumComponent {
    
    public dialogRef = inject(MatDialogRef<ViewPremiumComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);

    constructor() {
        this.accountService.getPremiumStatus().then(value => {
            if (value){
                this.dialogRef.close(true);
            }
        });         
    }

    public dismiss(): void { 
        this.dialogRef.close();
    }
}
