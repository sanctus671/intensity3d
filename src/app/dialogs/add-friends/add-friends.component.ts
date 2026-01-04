import { Component, inject, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { FriendsService } from '../../services/friends/friends.service';
import { AccountService } from '../../services/account/account.service';
import { ConfirmationComponent } from '../confirmation/confirmation.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-add-friends',
  templateUrl: './add-friends.component.html',
  styleUrls: ['./add-friends.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    TranslateModule
  ]
})
export class AddFriendsComponent {
    
    public dialogRef = inject(MatDialogRef<AddFriendsComponent>);
    public data = inject(MAT_DIALOG_DATA);
    public friendsService = inject(FriendsService);
    private accountService = inject(AccountService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    
    public users: Array<any> = [];
    public suggestedUsers: Array<any> = [];
    public properties: any;
    public account: any;
    
    constructor() {
        this.properties = {search:"", exerciseLimit:50, loading:true};
        
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
              
            this.friendsService.getSuggestedFriends(this.account.id).then((data) => {
                this.properties.loading = false;
                this.suggestedUsers = data;
            }).catch(() => {
                this.properties.loading = false;
            });
        });     
    }
    
    public searchUsers(): void {
        this.friendsService.searchUsers(this.properties.search).then((data) => {
            this.users = data;
            for (let friend of this.users){
                if (friend.friends.indexOf(friend.userid) > -1){
                    friend.added = true;
                }
                
                for (let request of this.account.requests){
                    if (request.userid === friend.userid){
                        friend.pending = true;
                        break;
                    }
                } 
            }            
        })
    }

    public clearSearch(): void {
        this.properties.search='';
    }
    
    public getDp(dp: string): string {
        return environment.apiUrl.replace("index.php", "") + dp;        
    }    

    public addUser(user: any): void {
        this.dialogRef.close({user:user});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
