import { Component, inject, ViewEncapsulation, signal, effect } from '@angular/core';
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
    
    // Signals
    public searchQuery = signal('');
    private searchTimeout: any = null;
    
    constructor() {
        this.properties = {exerciseLimit:50, loading:true};
        
        this.accountService.getAccountLocal().then((account: any) => {
            this.account = account;
              
            this.friendsService.getSuggestedFriends(this.account.id).then((data) => {
                this.properties.loading = false;
                this.suggestedUsers = data;
            }).catch(() => {
                this.properties.loading = false;
            });
        });
        
        // Debounced search effect
        effect(() => {
            const query = this.searchQuery();
            
            // Clear existing timeout
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            
            // If query is empty, clear users
            if (!query) {
                this.users = [];
                return;
            }
            
            // Set new timeout for debounced search (300ms)
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });
    }
    
    private performSearch(query: string): void {
        this.friendsService.searchUsers(query).then((data) => {
            this.users = data;
            for (let friend of this.users){
                if (friend.friends.indexOf(friend.userid) > -1){
                    friend.added = true;
                }
                
                // Check if account and requests are loaded before iterating
                if (this.account?.requests && Array.isArray(this.account.requests)) {
                    for (let request of this.account.requests){
                        if (request.userid === friend.userid){
                            friend.pending = true;
                            break;
                        }
                    }
                }
            }            
        })
    }

    public clearSearch(): void {
        this.searchQuery.set('');
    }
    
    public getDp(dp: string): string {
        return environment.apiUrl.replace("index.php", "") + dp;        
    }
    
    public formatName(item: any): string {
        if (!item){return ''}
        let name = item.display ? item.display : item.username;
        if (!name){return ''}
        name = name.split("@")[0]; 
        return name;      
    }

    public addUser(user: any): void {
        if (user.added){return}
        
        const username = this.formatName(user);
        const confirmDialogRef = this.dialog.open(ConfirmationComponent, {
            width: '300px',
            maxWidth: '95vw',
            data: {
                title: 'Add Friend',
                content: `Are you sure you want to send a friend request to ${username}?`
            }
        });
        
        confirmDialogRef.afterClosed().subscribe((result) => {
            if (result && result.confirm) {
                this.dialogRef.close({user:user});
            }
        });
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
