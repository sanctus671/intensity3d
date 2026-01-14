import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';
import { StorageService } from '../storage/storage.service';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private accountObservable: BehaviorSubject<any>;
  private activityCache: any = null;
  private activityCacheTimestamp: number = 0;
  private requestsCache: any = null;
  private requestsCacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(
    private request: RequestService,
    private storage: StorageService
  ) {
    this.accountObservable = new BehaviorSubject<any>(null);
  }

  getAccountObservable() {
    return this.accountObservable.asObservable();
  }

  setAccountObservable(user: any) {
    this.accountObservable.next(user);
    // Also persist to local storage so changes survive page refresh
    if (user) {
      this.storage.set('intensity__account', user);
    }
  }

  async getAccount(): Promise<any> {
    try {

      // Get session first
      const session = await this.storage.get('intensity__session');
      if (!session) {
        throw new Error('No session found');
      }
      
      // Preload cached account data
      const cachedAccount = await this.storage.get('intensity__account');
      if (cachedAccount) {
        this.setAccountObservable(cachedAccount);
      }
      
      // Make API request with sessionid field
      const account = await this.request.get('view', 'getuserdata', 'account', { sessionid: session });

      
      if (account && Object.keys(account).length > 0) {
        let user = account;
        user["dp"] = environment.apiUrl.replace("index.php", "") + account["dp"];

        // Save account data to local storage (as object, not stringified for consistency with mobile app)
        await this.storage.set('intensity__account', account);
        console.log('Account saved to local storage');
        
        // Save userid to local storage
        if (account.id) {
          await this.storage.set('intensity__userid', parseInt(account.id));

        }
        
        // Save locale to local storage
        if (account.locale) {
          await this.storage.set('intensity__locale', account.locale);

        }
        
        // Update the observable
        this.setAccountObservable(account);
      } else {
        //console.warn('Account data is empty or invalid:', account);
      }
      
      return account;
    } catch (error) {

      // Try to load from local storage if API fails (offline mode)
      const cachedAccount = await this.storage.get('intensity__account');
      if (cachedAccount) {
        this.setAccountObservable(cachedAccount);
        return cachedAccount;
      }
      
      throw error;
    }
  }

  updateAccount(accountData: any): Promise<any> {
    return this.request.modify('edit', 'updateaccount', accountData);
  }

  purchasePremium(billingInfo: any): Promise<any> {
    return this.request.modify('edit', 'purchasepremiumpaymentintent', billingInfo);
  }

  getSettings(): Promise<any> {
    return this.request.get('view', 'getsettings', 'settings', {});
  }

  updateSettings(settings: any, userId:number): Promise<any> {
    return this.request.modify('edit', 'updatesettings', {...settings, userid: userId});
  }

  getPremiumStatus(): Promise<any> {
    return this.request.get('view', 'getpremiumstatus', 'premium_status', {});
  }

  async getUserActivity(userId: number | null, page: number = 1, forceRefresh: boolean = false): Promise<any> {
    // Only cache page 1
    if (page === 1) {
      const now = Date.now();
      const cacheIsValid = this.activityCache && (now - this.activityCacheTimestamp < this.CACHE_DURATION);
      
      if (!forceRefresh && cacheIsValid) {
        return Promise.resolve(this.activityCache);
      }
    }

    const data = await this.request.get('view', 'getactivity', `useractivity${userId}-${page}`, { userid: userId, page, limit: 20 });
    
    // Cache page 1 results
    if (page === 1) {
      this.activityCache = data;
      this.activityCacheTimestamp = Date.now();
    }
    
    return data;
  }

  updateProfile(profileData: any): Promise<any> {
    return this.request.modify('edit', 'updateprofile', profileData);
  }



    public getUserId(){
        return this.storage.get("intensity__userid");
    }

    public getLocale(){
        return this.storage.get("intensity__locale");
    }

    public setLocale(locale:string){
        return this.storage.set("intensity__locale", locale);
    }

    public setWeightCalculatorProps(weightCalculatorProps:any){
        return this.storage.set("intensity__weightcalculator", JSON.stringify(weightCalculatorProps));
    }

    public getWeightCalculatorProps(){
        return this.storage.get("intensity__weightcalculator");
    }

    public setPlateColors(plateColors:any){
        return this.storage.set("intensity__platecolors", JSON.stringify(plateColors));
    }

    public getPlateColors(){
        return this.storage.get("intensity__platecolors");
    }

    public getProfile(userId:number){

        return this.request.get("view", "getusers", "profile" + userId, {id:userId})

    }


  uploadDp(file: File, userId: number): Promise<any> {
    const formData = new FormData();
    formData.append('fileToUpload', file, file.name);
    formData.set("controller", "edit");
    formData.set("action", "uploaddp");
    formData.append('userid', userId.toString());
    return this.request.upload('uploaddp', formData);
  }

  async getFriendRequests(forceRefresh: boolean = false): Promise<any> {
    const now = Date.now();
    const cacheIsValid = this.requestsCache && (now - this.requestsCacheTimestamp < this.CACHE_DURATION);
    
    if (!forceRefresh && cacheIsValid) {
      return Promise.resolve(this.requestsCache);
    }

    const data = await this.request.get('view', 'getfriendrequests', 'friendrequests', {});
    
    // Update cache
    this.requestsCache = data;
    this.requestsCacheTimestamp = now;
    
    return data;
  }

  clearActivityCache(): void {
    this.activityCache = null;
    this.activityCacheTimestamp = 0;
  }

  clearRequestsCache(): void {
    this.requestsCache = null;
    this.requestsCacheTimestamp = 0;
  }

  async getAccountLocal(): Promise<any> {
    const account = await this.storage.get('intensity__account');
    // Handle both stringified and object formats for backwards compatibility
    if (typeof account === 'string') {
      return JSON.parse(account);
    }
    return account;
  }

  // Goal target management
  addTarget(userId: number): Promise<any> {
    return this.request.modify('create', 'addtarget', { userid: userId });
  }

  updateTarget(target: any, userId: number): Promise<any> {
    return this.request.modify('edit', 'updatetarget', { 
      userid: userId, 
      id: target.id, 
      exerciseid: target.exerciseid, 
      target: target.target 
    });
  }

  removeTarget(target: any, userId: number): Promise<any> {
    return this.request.modify('edit', 'deletetarget', { 
      userid: userId, 
      id: target.id 
    });
  }

  // Goal reset management
  getResets(): Promise<any> {
    return this.request.get('view', 'getresets', 'resets', {});
  }

  addReset(userId: number): Promise<any> {
    return this.request.modify('create', 'addreset', { userid: userId });
  }

  updateReset(reset: any, userId: number): Promise<any> {
    return this.request.modify('edit', 'updatereset', { 
      userid: userId, 
      id: reset.id, 
      exerciseid: reset.exerciseid, 
      resetdate: reset.resetdate 
    });
  }

  removeReset(reset: any, userId: number): Promise<any> {
    return this.request.modify('edit', 'deletereset', { 
      userid: userId, 
      id: reset.id 
    });
  }
}

