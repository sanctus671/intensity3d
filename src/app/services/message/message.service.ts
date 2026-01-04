import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messagesObservable: BehaviorSubject<any>;

  constructor(private request: RequestService) {
    this.messagesObservable = new BehaviorSubject<any>(null);
  }

  getMessagesObservable() {
    return this.messagesObservable.asObservable();
  }

  setMessagesObservable(update: any) {
    this.messagesObservable.next(update);
  }

  getConversations(): Promise<any> {
    return this.request.get('view', 'getconversations', 'conversations', {});
  }

  getMessages(userId: number): Promise<any> {
    return this.request.get('view', 'getmessages', `messages${userId}`, { friendid: userId });
  }

  sendMessage(userId: number, message: string): Promise<any> {
    return this.request.modify('create', 'savemessage', { friendid: userId, message });
  }

  createMessages(message: string, friendId: number): Promise<any> {
    return this.request.modify('create', 'savemessage', { friendid: friendId, message });
  }

  deleteMessage(messageId: number): Promise<any> {
    return this.request.modify('edit', 'removemessage', { id: messageId });
  }

  markAsRead(userId: number): Promise<any> {
    return this.request.modify('edit', 'markasread', { friendid: userId });
  }
}
