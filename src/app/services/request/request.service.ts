import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RequestService {
  public heartbeatStarted = false;
  public heartbeat: any;
  public processingRequests = false;
  public processRequestsCheck = 10;
  private refreshObservable: BehaviorSubject<any>;

  constructor(
    private http: HttpClient,
    private storage: StorageService
  ) {
    this.refreshObservable = new BehaviorSubject<any>(null);
  }

  public getRefreshObservable(): Observable<any> {
    return this.refreshObservable.asObservable();
  }

  public setRefreshObservable(update: any): void {
    this.refreshObservable.next(update);
  }

  public get(controller: string, action: string, dataKey: string | null, requestData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.doRequest(controller, action, requestData).then((responseData: any) => {
        if (dataKey) {
          this.storeResponse(controller, action, dataKey, requestData, responseData);
        }

        // Random spot check for failed requests
        this.processRequestsCheck += 1;
        if (this.processRequestsCheck > 10) {
          this.processStoredRequests();
        }

        resolve(responseData);
      }).catch((error) => {
        if (!dataKey) {
          reject(false);
        } else {
          this.storage.executeSQL(`SELECT response_data FROM responses WHERE data_key = "${dataKey}" LIMIT 1;`)
            .then((storedRows) => {
              if (storedRows.values.length > 0) {
                const firstRow = storedRows.values[0];
                const responseDataJson = firstRow[0] as string;
                
                try {
                  // The response_data is stored with escaped quotes, so we need to unescape them
                  const unescapedJson = responseDataJson.replace(/''/g, "'");
                  const firstRowResponse = JSON.parse(unescapedJson);
                  console.log(`Using cached response for ${controller}/${action}`);
                  resolve(firstRowResponse);
                } catch (parseError) {
                  console.error('Error parsing cached response:', parseError);
                  reject(false);
                }
              } else {
                console.warn(`No cached response available for ${controller}/${action}`);
                reject(false);
              }
            })
            .catch((sqlError) => {
              console.error('Error retrieving cached response:', sqlError);
              reject(false);
            });
        }
      });
    });
  }

  public modify(controller: string, action: string, requestData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      requestData.duplicate_id = this.generateRandomString();

      this.doRequest(controller, action, requestData).then((responseData: any) => {
        resolve(responseData);
      }).catch(async () => {
        if (action === 'edit' && controller.indexOf('remove') > -1 && requestData.request_id) {
          // Find the request with request_id and delete that
          await this.storage.executeSQL(`DELETE FROM requests WHERE request_id = "${requestData.request_id}" LIMIT 1;`);
          resolve(false);
        } else if (action === 'edit' && requestData.request_id) {
          // Find the request with request_id and update that
          const storedRequest = await this.storage.executeSQL(`SELECT request FROM requests WHERE request_id = "${requestData.request_id}" LIMIT 1;`);

          if (storedRequest.values.length > 0) {
            const firstRow = storedRequest.values[0];
            const firstRowRequest = JSON.parse(firstRow[0] as string);
            const mergedRequestData = Object.assign(firstRowRequest, requestData);

            await this.storage.executeSQL(`
              UPDATE requests SET request = '${JSON.stringify(mergedRequestData).replace(/'/g, "''")}' 
              WHERE request_id = '${requestData.request_id}';
            `);

            resolve(false);
          } else {
            reject(false);
          }
        } else {
          const fullRequest = { controller: controller, action: action, ...requestData };
          const requestJson = JSON.stringify(fullRequest).replace(/'/g, "''");

          await this.storage.executeSQL(`
            INSERT INTO requests (duplicate_id, request, failed) 
            VALUES ('${fullRequest.duplicate_id}', '${requestJson}', 0);
          `);

          const result = await this.storage.executeSQL(`SELECT * FROM requests ORDER BY request_id DESC LIMIT 1`);

          const returnData = result.values && result.values.length > 0 
            ? { request_id: result.values[0][0] } 
            : false;

          resolve(returnData);
        }
      });
    });
  }

  public async storeResponse(
    controller: string,
    action: string,
    dataKey: string,
    requestData: any,
    responseData: any
  ): Promise<void> {
    const escapedResponseData = JSON.stringify(responseData).replace(/'/g, "''");
    const escapedRequestData = JSON.stringify(requestData).replace(/'/g, "''");
    
    const queryString = `
      INSERT OR REPLACE INTO responses (data_key, controller, action, request_data, response_data) 
      VALUES ('${dataKey}', '${controller}', '${action}', '${escapedRequestData}', '${escapedResponseData}');
    `;

    try {
      await this.storage.executeSQL(queryString);
    } catch (e) {
      console.error('Error storing response:', e);
    }
  }

  private doRequest(controller: string, action: string, extraData: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get('intensity__session').then((session) => {
        const data = {
          key: environment.apiKey,
          session: session,
          controller: controller,
          action: action,
          ...extraData
        };


        this.http.post(environment.apiUrl, data).subscribe({
          next: (res: any) => {
          
            if (res['success'] === true) {
  
              resolve(res['data']);
            } else {
   
              reject(res);
            }
          },
          error: (e) => {
    
            this.activateHeartbeat();
            reject(false);
          }
        });
      });
    });
  }

  public rawRequest(request: any): Promise<any> {
    // For special requests (e.g., wearos)
    return new Promise((resolve, reject) => {
      this.storage.get('intensity__session').then((session) => {
        this.http.post(environment.apiUrl, request).subscribe({
          next: (res: any) => {
            if (res['success'] === true) {
              resolve(res['data']);
            } else {
              reject(res);
            }
          },
          error: (e) => {
            reject(false);
          }
        });
      });
    });
  }

  public upload(action: string, formData: FormData): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get('intensity__session').then((session) => {
        formData.append('key', environment.apiKey);
        formData.append('session', session || '');
        formData.append('action', action);

        this.http.post(environment.apiUrl, formData).subscribe({
          next: (res: any) => {
            if (res['success'] === true) {
              resolve(res['data']);
            } else {
              reject(res);
            }
          },
          error: (e) => {
            this.activateHeartbeat();
            reject(false);
          }
        });
      });
    });
  }

  private activateHeartbeat(): void {
    if (this.heartbeatStarted) {
      return;
    }

    this.heartbeatStarted = true;

    this.heartbeat = setInterval(() => {
      this.http.post(environment.apiUrl, { key: environment.apiKey }).subscribe({
        next: (res) => {
          clearInterval(this.heartbeat);
          this.heartbeatStarted = false;
          this.processStoredRequests();
        },
        error: (e) => {
          // Still offline
        }
      });
    }, 20000);
  }

  private async processStoredRequests(): Promise<void> {
    if (this.processingRequests) {
      return;
    }

    this.processingRequests = true;
    this.processRequestsCheck = 0;

    try {
      const storedRows = await this.storage.executeSQL(`SELECT * FROM requests ORDER BY request_id ASC`);

      if (storedRows.values && storedRows.values.length > 0) {
        let updatesMade = 0;

        for (const entry of storedRows.values) {
          const requestId = entry[0];
          const duplicateId = entry[1];
          const requestJson = entry[2];
          const failed = entry[3];

          const entryFullRequestData = JSON.parse(requestJson as string);
          const { action, controller, ...otherProps } = entryFullRequestData;

          try {
            await this.doRequest(controller, action, otherProps);
            updatesMade += 1;

            if (failed === 1) {
              await this.storage.executeSQL(`UPDATE requests SET failed = 0 WHERE request_id = '${requestId}';`);
            }
          } catch {
            if (failed === 1) {
              await this.storage.executeSQL(`UPDATE requests SET failed = 2 WHERE request_id = '${requestId}';`);
            } else {
              await this.storage.executeSQL(`UPDATE requests SET failed = 1 WHERE request_id = '${requestId}';`);
            }
          }
        }

        await this.storage.executeSQL(`DELETE FROM requests WHERE failed = 0 OR failed = 2;`);

        this.processingRequests = false;

        if (updatesMade > 0) {
          this.setRefreshObservable({ update: true });
        }
      } else {
        this.processingRequests = false;
      }
    } catch (e) {
      this.processingRequests = false;
    
    }
  }

  generateRandomString(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }

    return randomString;
  }
}
