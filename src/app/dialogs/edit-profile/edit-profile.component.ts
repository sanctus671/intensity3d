import { Component, inject, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AccountService } from '../../services/account/account.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    CdkTextareaAutosize,
    TranslateModule
  ]
})
export class EditProfileComponent {
    
    public dialogRef = inject(MatDialogRef<EditProfileComponent>);
    public data = inject(MAT_DIALOG_DATA);
    private accountService = inject(AccountService);
    private snackBar = inject(MatSnackBar);
    private translate = inject(TranslateService);

    @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;

    public profile: any;
    private uploadedDp: string | null = null;
    
    constructor() {
        this.profile = {};
        
        if (this.data.profile){
            Object.assign(this.profile, this.data.profile);
        }
    }
    
    public getDp(dp: string): string {
        if (!dp) {
            return environment.apiUrl.replace('index.php', '') + 'uploads/default.png';
        }
        if (dp.startsWith('http')) {
            return dp;
        }
        return environment.apiUrl.replace('index.php', '') + dp;
    }

    public uploadAvatar(): void {
        this.avatarInput.nativeElement.click();
    }

    public async onAvatarChange(event: Event): Promise<void> {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        const snackBarRef = this.snackBar.open(
            this.translate.instant('Uploading image...'),
            '',
            { duration: 10000 }
        );

        try {
            const image = await this.accountService.uploadDp(file, this.profile.userid);
            this.uploadedDp = image;
            this.profile.dp = image;
            
            snackBarRef.dismiss();
            this.snackBar.open(
                this.translate.instant('Profile picture updated'),
                '',
                { duration: 3000 }
            );
        } catch (error) {
            snackBarRef.dismiss();
            this.snackBar.open(
                this.translate.instant('Failed to upload image'),
                '',
                { duration: 3000 }
            );
        }
    }
    
    public save(): void {
        // Only return the fields that were actually edited to avoid spreading
        // numeric indices from the API response into the account object
        const updatedProfile = {
            userid: this.profile.userid,
            display: this.profile.display,
            gender: this.profile.gender,
            about: this.profile.about
        };
        this.dialogRef.close({profile: updatedProfile, dp: this.uploadedDp});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
