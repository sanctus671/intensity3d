import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { environment } from '../../../environments/environment';

export interface AuthStatus {
  authenticated: boolean;
  newUser: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private authStatus: BehaviorSubject<AuthStatus | null>;
  public isAuthenticated = signal(false);

  constructor(
    private storage: StorageService,
    private http: HttpClient
  ) {
    this.authStatus = new BehaviorSubject<AuthStatus | null>(null);
    this.checkSession();
  }

  private async checkSession(): Promise<void> {
    const session = await this.storage.get('intensity__session');
    if (session) {
      this.isAuthenticated.set(true);
      this.authStatus.next({ authenticated: true, newUser: false });
    }
  }

  public getAuthStatus(): Observable<AuthStatus | null> {
    return this.authStatus.asObservable();
  }

  public setAuthStatus(status: boolean, newUser: boolean = false): void {
    this.isAuthenticated.set(status);
    this.authStatus.next({ authenticated: status, newUser: newUser });
  }

  public async getSession(): Promise<string | null> {
    return await this.storage.get('intensity__session');
  }

  public login(email: string, password: string, newUser: boolean = false): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const data = {
        key: environment.apiKey,
        session: null,
        controller: 'authentication',
        action: 'login',
        username: email,
        password: password
      };

      this.http.post(environment.apiUrl, data).subscribe({
        next: (res: any) => {
          if (res['success'] === true) {
            this.storage.set('intensity__session', res['data']['sessionid']).then(() => {
              this.setAuthStatus(true, newUser);
              resolve(true);
            }).catch(() => {
              reject('There was an error logging in');
            });
          } else {
            reject(res['errormsg']);
          }
        },
        error: (e) => {
          reject(e);
        }
      });
    });
  }

  public loginFb(profile: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const data = {
        key: environment.apiKey,
        session: null,
        controller: 'authentication',
        action: 'loginfb',
        id: profile.id,
        name: profile.name,
        email: profile.email
      };

      this.http.post(environment.apiUrl, data).subscribe({
        next: (res: any) => {
          if (res['success'] === true) {
            this.storage.set('intensity__session', res['data']['sessionid']).then(() => {
              this.setAuthStatus(true, res['data']['new']);
              resolve(true);
            }).catch(() => {
              reject('There was an error logging in');
            });
          } else {
            reject(res['errormsg']);
          }
        },
        error: (e) => {
          reject(e);
        }
      });
    });
  }

  public loginApple(profile: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const data = {
        key: environment.apiKey,
        session: null,
        controller: 'authentication',
        action: 'loginapple',
        id: profile.id,
        name: profile.name,
        email: profile.email
      };

      this.http.post(environment.apiUrl, data).subscribe({
        next: (res: any) => {
          if (res['success'] === true) {
            this.storage.set('intensity__session', res['data']['sessionid']).then(() => {
              this.setAuthStatus(true, res['data']['new']);
              resolve(true);
            }).catch(() => {
              reject('There was an error logging in');
            });
          } else {
            reject(res['errormsg']);
          }
        },
        error: (e) => {
          reject(e);
        }
      });
    });
  }

  public register(email: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const data = {
        key: environment.apiKey,
        session: null,
        controller: 'create',
        action: 'createuser',
        username: email,
        password: password
      };

      this.http.post(environment.apiUrl, data).subscribe({
        next: (res: any) => {
          if (res['success'] === true) {
            this.login(email, password, true).then(() => {
              resolve(true);
            }).catch((e) => {
              reject(e);
            });
          } else {
            reject(res['errormsg']);
          }
        },
        error: (e) => {
          reject(e);
        }
      });
    });
  }

  public registerAnonymous(): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = {
        key: environment.apiKey,
        session: null,
        controller: 'create',
        action: 'createanonymoususer'
      };

      this.http.post(environment.apiUrl, data).subscribe({
        next: (res: any) => {
          if (res['success'] === true) {
            const account = res['data'];
            this.login(account['username'], account['password'], true).then(() => {
              resolve(account);
            }).catch((e) => {
              reject(e);
            });
          } else {
            reject(res);
          }
        },
        error: (e) => {
          reject(e);
        }
      });
    });
  }

  public resetPassword(email: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const data = {
        key: environment.apiKey,
        session: null,
        controller: 'edit',
        action: 'resetpassword',
        email: email
      };

      this.http.post(environment.apiUrl, data).subscribe({
        next: (res: any) => {
          if (res['success'] === true) {
            resolve(true);
          } else {
            reject(res);
          }
        },
        error: (e) => {
          reject(e);
        }
      });
    });
  }

  public changePassword(oldPassword: string, newPassword: string, userId: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.storage.get('intensity__session').then((session) => {
        if (session) {
          const data = {
            key: environment.apiKey,
            session: session,
            controller: 'edit',
            action: 'updateuser',
            id: userId,
            oldpassword: oldPassword,
            password: newPassword
          };

          this.http.post(environment.apiUrl, data).subscribe({
            next: (res: any) => {
              if (res['success'] === true) {
                resolve(true);
              } else {
                reject(res);
              }
            },
            error: (e) => {
              reject(e);
            }
          });
        } else {
          reject('No session found');
        }
      });
    });
  }

  public logout(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.storage.get('intensity__session').then((session) => {
        if (session) {
          this.storage.remove('intensity__session').then(() => {});

          const data = {
            key: environment.apiKey,
            session: session,
            controller: 'authentication',
            action: 'logout'
          };

          this.http.post(environment.apiUrl, data).subscribe({
            next: (res: any) => {
              if (res['success'] === true) {
                this.setAuthStatus(false);
                resolve(true);
              } else {
                resolve(true);
              }
            },
            error: (e) => {
              resolve(true);
            }
          });
        } else {
          resolve(true);
        }
      });
    });
  }

  public deleteAccount(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.storage.get('intensity__session').then((session) => {
        if (session) {
          this.storage.remove('intensity__session').then(() => {});

          const data = {
            key: environment.apiKey,
            session: session,
            controller: 'authentication',
            action: 'delete'
          };

          this.http.post(environment.apiUrl, data).subscribe({
            next: (res: any) => {
              if (res['success'] === true) {
                this.setAuthStatus(false);
                resolve(true);
              } else {
                resolve(true);
              }
            },
            error: (e) => {
              resolve(true);
            }
          });
        } else {
          resolve(true);
        }
      });
    });
  }
}
