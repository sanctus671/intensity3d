import { Injectable } from '@angular/core';
import { RequestService } from '../request/request.service';

@Injectable({
  providedIn: 'root'
})
export class BodyweightService {
  constructor(private request: RequestService) {}

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
}
