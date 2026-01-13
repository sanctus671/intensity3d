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
  selector: 'app-search-friends',
  templateUrl: './search-friends.component.html',
  styleUrls: ['./search-friends.component.scss'],
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
export class SearchFriendsComponent {
    
    public dialogRef = inject(MatDialogRef<SearchFriendsComponent>);
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
              
            this.friendsService.getFriends().then((data: any) => {
                this.properties.loading = false;
                
                // Sort friends alphabetically by display name or username
                const sortedFriends = data.sort((a: any, b: any) => {
                    const nameA = a.display ? a.display : a.username;
                    const nameB = b.display ? b.display : b.username;
                    if (nameA < nameB) return -1;
                    if (nameA > nameB) return 1;
                    return 0;
                });
                
                this.suggestedUsers = sortedFriends;
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
        this.dialogRef.close({user:user});
    }    
    
    public dismiss(): void { 
        this.dialogRef.close();
    }
}
