import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RequestService } from '../request/request.service';
import { StorageService } from '../storage/storage.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BodyweightService {
  private readonly request = inject(RequestService);
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);

  getBodyweightEntries(startDate?: string, endDate?: string): Promise<any> {
    return this.request.get('view', 'getbodyweights', 'bodyweights', {});
  }

  addBodyweightEntry(date: string, weight: number, unit: string): Promise<any> {
    return this.request.modify('create', 'savebodyweight', { weight });
  }

  updateBodyweightEntry(entryId: number, weight: number, unit: string): Promise<any> {
    return this.request.modify('edit', 'updatebodyweight', { id: entryId, weight });
  }

  deleteBodyweightEntry(entryId: number): Promise<any> {
    return this.request.modify('edit', 'removebodyweight', { id: entryId });
  }

  importBodyweight(data: any[]): Promise<any> {
    return this.request.modify('edit', 'importbodyweight', { data });
  }

  // Import/Export methods from mobile app
  public getExport(userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get("intensity__session").then((session) => {
        const data = {
          key: environment.apiKey,
          session: session,
          controller: "view",
          action: "getbodyweightexport",
          userid: userId
        };

        this.http.post(environment.apiUrl, data).subscribe(
          (res: any) => {
            if (res["success"] === true) {
              resolve(res["data"]);
            } else {
              reject(res);
            }
          },
          (e) => {
            reject(e);
          }
        );
      });
    });
  }

  public getImports(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get("intensity__session").then((session) => {
        const data = {
          key: environment.apiKey,
          session: session,
          controller: "view",
          action: "getbodyweightimports"
        };

        this.http.post(environment.apiUrl, data).subscribe(
          (res: any) => {
            if (res["success"] === true) {
              resolve(res["data"]);
            } else {
              reject(res);
            }
          },
          (e) => {
            reject(e);
          }
        );
      });
    });
  }

  public uploadImport(csvFile: File, userId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get("intensity__session").then((session) => {
        const formData: FormData = new FormData();
        formData.append('fileToUpload', csvFile, csvFile.name);
        formData.set("key", environment.apiKey);
        formData.set("controller", "edit");
        formData.set("action", "uploadbodyweightimportfile");
        formData.set("userid", userId + "");
        formData.set("session", session);

        this.http.post(environment.apiUrl, formData).subscribe(
          (res: any) => {
            if (res["success"] === true) {
              let importUrl = environment.apiUrl.replace("index.php", "") + res.data;
              resolve(importUrl);
            } else {
              reject(res);
            }
          },
          (e) => {
            reject(e);
          }
        );
      });
    });
  }

  public importFile(fileUrl: string, delimiter: string, mapping: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get("intensity__session").then((session) => {
        const data = {
          key: environment.apiKey,
          session: session,
          controller: "edit",
          action: "importbodyweightfile",
          file: fileUrl,
          delimiter: delimiter,
          mapping: mapping
        };

        this.http.post(environment.apiUrl, data).subscribe(
          (res: any) => {
            if (res["success"] === true) {
              resolve(res);
            } else {
              reject(res);
            }
          },
          (e) => {
            reject(e);
          }
        );
      });
    });
  }

  public getCSVData(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.http.get(url, { responseType: 'text' }).subscribe(
        (res: any) => {
          resolve(res);
        },
        (e) => {
          reject(false);
        }
      );
    });
  }

  public removeImport(addId: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.storage.get("intensity__session").then((session) => {
        const requestData = {
          key: environment.apiKey,
          session: session,
          controller: "edit",
          action: "removebodyweightimport",
          addid: addId
        };

        this.http.post(environment.apiUrl, requestData).subscribe(
          (res: any) => {
            if (res["success"] === true) {
              resolve(res["data"]);
            } else {
              reject(res);
            }
          },
          (e) => {
            reject(e);
          }
        );
      });
    });
  }
}
