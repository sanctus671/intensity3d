import { Component, OnInit, ViewChild, ElementRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TextFieldModule } from '@angular/cdk/text-field';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import moment from 'moment';

import { AccountService } from '../../services/account/account.service';
import { MessageService } from '../../services/message/message.service';
import { ThemeService } from '../../services/theme/theme.service';
import { environment } from '../../../environments/environment';
import { SearchFriendsComponent } from '../../dialogs/search-friends/search-friends.component';

interface Conversation {
  friendid: number;
  created: Date | string;
  message: string;
  profile: {
    display: string;
    username: string;
    dp: string;
    userid: number;
  };
  userid: number;
  groupuserid: number;
}

interface Message {
  id: number | null;
  message: string;
  created: Date | string;
  userid: number;
  friendid: number;
  isBefore?: boolean;
  isAfter?: boolean;
  showTime?: boolean;
}

interface Properties {
  conversationsLoading: boolean;
  messagesLoading: boolean;
}

@Component({
  selector: 'app-messages',
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatButtonModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TextFieldModule,
    TranslateModule
  ],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MessagesComponent implements OnInit {
  @ViewChild('scrollBottom', { static: false }) private scrollBottom?: ElementRef;
  
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly route = inject(ActivatedRoute);
  private readonly accountService = inject(AccountService);
  private readonly messageService = inject(MessageService);
  private readonly translate = inject(TranslateService);
  public readonly themeService = inject(ThemeService);
  
  // Signals
  conversations = signal<Conversation[]>([]);
  selectedConversation = signal<number | null>(null);
  selectedProfile = signal<any>({});
  account = signal<any>({});
  messages = signal<Message[]>([]);
  properties = signal<Properties>({
    conversationsLoading: true,
    messagesLoading: true
  });
  message = signal<string>('');
  
  private pingInterval: any;

  async ngOnInit(): Promise<void> {
    try {
      const account = await this.accountService.getAccountLocal();
      this.account.set(account);
      
      const conversations = await this.messageService.getConversations();
      this.conversations.set(conversations || []);
      this.properties.update(p => ({ ...p, conversationsLoading: false }));
      
      const userId = this.route.snapshot.params['userid'];
      if (userId) {
        await this.openConversationByUser(userId);
      } else if (conversations && conversations.length > 0) {
        this.openConversation(0);
      } else {
        this.properties.update(p => ({ ...p, messagesLoading: false }));
      }
      
      // Start polling for new messages
      this.pingInterval = setInterval(() => {
        this.pingMessages();
      }, 10000);
    } catch (error) {
      console.error('Error initializing messages:', error);
      this.properties.update(p => ({
        conversationsLoading: false,
        messagesLoading: false
      }));
    }
  }
  
  ngOnDestroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }
  
  private scrollToBottom(): void {
    setTimeout(() => {
      const objDiv = document.getElementById("message-list");
      if (objDiv) {
        objDiv.scrollTop = objDiv.scrollHeight;
      }
    }, 100);
  }
  
  openConversation(index: number): void {
    const conversations = this.conversations();
    if (!conversations[index]) return;
    
    this.selectedConversation.set(index);
    this.selectedProfile.set(conversations[index].profile);
    this.messages.set([]);
    this.getMessages(conversations[index].groupuserid);
  }
  
  async openConversationByUser(userId: string | number): Promise<void> {
    const conversations = this.conversations();
    let conversationFound = false;
    const targetUserId = Number(userId);
    
    // Find existing conversation with this user
    // Note: API returns string IDs, so we use == for type-coercing comparison
    for (let index = 0; index < conversations.length; index++) {
      const conversation = conversations[index];
      
      if (conversation.friendid == targetUserId || 
          conversation.groupuserid == targetUserId ||
          conversation.profile?.userid == targetUserId) {
        this.openConversation(index);
        conversationFound = true;
        break;
      }
    }
    
    if (!conversationFound) {
      const username = this.route.snapshot.queryParamMap.get('username') || '';
      const newConversation: Conversation = {
        friendid: Number(userId),
        created: new Date(),
        message: "",
        profile: {
          display: username || 'Loading...',
          username: username || 'Loading...',
          dp: "uploads/default.png",
          userid: Number(userId)
        },
        userid: this.account().id,
        groupuserid: Number(userId)
      };
      
      // Add conversation and select it immediately
      this.conversations.update(convs => [newConversation, ...convs]);
      this.selectedConversation.set(0);
      this.selectedProfile.set(newConversation.profile);
      this.messages.set([]);
      
      // Load profile and messages in parallel
      const profilePromise = this.accountService.getProfile(Number(userId))
        .then(profile => {
          // Update the conversation with real profile data
          this.conversations.update(convs => {
            const updated = [...convs];
            if (updated[0] && updated[0].friendid === Number(userId)) {
              updated[0].profile.username = profile.username;
              updated[0].profile.display = profile.display;
              updated[0].profile.dp = profile.dp.replace(environment.apiUrl.replace("index.php", ""), "");
              this.selectedProfile.set(updated[0].profile);
            }
            return updated;
          });
        })
        .catch(error => {
          console.error('Error loading profile:', error);
        });
      
      // Load messages immediately
      this.getMessages(Number(userId));
    }
  }
  
  createConversation(): void {
    const dialogRef = this.dialog.open(SearchFriendsComponent, {
      width: '400px',
      data: {}
    });
    
    dialogRef.afterClosed().subscribe(data => {
      if (data && data.user) {
        const user = data.user;
        const userId = user.friendid ? user.friendid : user.userid;
        const conversations = this.conversations();
        let conversationExists = false;
        
        for (let index = 0; index < conversations.length; index++) {
          const conversation = conversations[index];
          if (userId === conversation.friendid) {
            this.openConversation(index);
            conversationExists = true;
            break;
          }
        }
        
        if (conversationExists) return;
        
        const newConversation: Conversation = {
          friendid: userId,
          created: new Date(),
          message: "",
          profile: {
            display: user.display,
            username: user.username,
            dp: user.dp,
            userid: userId
          },
          userid: this.account().id,
          groupuserid: userId
        };
        
        this.conversations.update(convs => [newConversation, ...convs]);
        this.openConversation(0);
      }
    });
  }
  
  async refreshConversations(): Promise<void> {
    const selectedIndex = this.selectedConversation();
    if (selectedIndex === null) return;
    
    const currentUserId = this.conversations()[selectedIndex].friendid;
    
    try {
      const data = await this.messageService.getConversations();
      this.conversations.set(data);
      
      const conversations = this.conversations();
      for (let index = 0; index < conversations.length; index++) {
        const conversation = conversations[index];
        if (currentUserId === conversation.friendid) {
          this.selectedConversation.set(index);
          break;
        }
      }
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  }
  
  async getMessages(userId: number): Promise<void> {
    this.properties.update(p => ({ ...p, messagesLoading: true }));
    
    try {
      const data = await this.messageService.getMessages(userId);
      this.messages.set(data || []);
      this.calculateMessages();
      this.scrollToBottom();
      this.properties.update(p => ({ ...p, messagesLoading: false }));
    } catch (error) {
      console.error('Error loading messages:', error);
      this.properties.update(p => ({ ...p, messagesLoading: false }));
    }
  }
  
  private calculateMessages(): void {
    const messages = this.messages();
    const updatedMessages = messages.map((message, index) => {
      const previousMessage = messages[index - 1];
      const nextMessage = messages[index + 1];
      
      let isBefore = false;
      let isAfter = false;
      
      if (previousMessage && message.userid === previousMessage.userid) {
        isAfter = true;
      }
      
      if (nextMessage && message.userid === nextMessage.userid) {
        isBefore = true;
      }
      
      return {
        ...message,
        isBefore,
        isAfter
      };
    });
    
    this.messages.set(updatedMessages);
  }
  
  private async pingMessages(): Promise<void> {
    const conversations = this.conversations();
    const selectedIndex = this.selectedConversation();
    
    if (conversations.length < 1 || selectedIndex === null) return;
    
    try {
      const data = await this.messageService.getMessages(conversations[selectedIndex].friendid);
      const currentMessages = this.messages();
      
      if (data && data.length > currentMessages.length) {
        this.messages.set(data);
        this.calculateMessages();
        this.scrollToBottom();
        await this.refreshConversations();
      }
    } catch (error) {
      // Silently fail - this is a background polling operation
    }
  }
  
  async sendMessage(): Promise<void> {
    const messageText = this.message();
    if (!messageText.trim()) return;
    
    const conversations = this.conversations();
    const selectedIndex = this.selectedConversation();
    
    if (selectedIndex === null || !conversations[selectedIndex]) return;
    
    const newMessage: Message = {
      id: null,
      message: messageText,
      created: new Date(),
      userid: this.account().id,
      friendid: conversations[selectedIndex].friendid
    };
    
    this.messages.update(msgs => [...msgs, newMessage]);
    this.message.set("");
    this.calculateMessages();
    this.scrollToBottom();
    
    try {
      const data = await this.messageService.createMessages(newMessage.message, conversations[selectedIndex].friendid);
      
      // Update the message with the actual ID from the server
      this.messages.update(msgs => 
        msgs.map(msg => 
          msg === newMessage ? { ...msg, id: data["id"] } : msg
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
      this.snackBar.open(
        this.translate.instant('Failed to send message'),
        '',
        { duration: 3000 }
      );
    }
  }
  
  getDp(dp: string): string {
    if (!dp) return '';
    if (dp.startsWith('http')) return dp;
    return environment.apiUrl.replace("index.php", "") + dp;
  }
  
  getMessageTime(date: Date | string): string {
    return moment(date).fromNow();
  }
  
  getExactMessageTime(date: Date | string): string {
    return moment(date).format("MMMM Do YYYY, HH:mm");
  }
}
