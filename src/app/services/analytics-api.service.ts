import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {AnalyticsOverview, ApplicationMetric, OfferMetric} from '../models/api.models';

@Injectable({providedIn: 'root'})
export class AnalyticsApiService {
  private readonly api = `${environment.apiBaseUrl}/recruiter/analytics`;
  constructor(private readonly http: HttpClient) {}

  overview() { return this.http.get<AnalyticsOverview>(`${this.api}/overview`); }
  offers() { return this.http.get<OfferMetric[]>(`${this.api}/offers`); }
  applications() { return this.http.get<ApplicationMetric[]>(`${this.api}/applications`); }
  exportPdf() { return this.http.get(`${this.api}/export/pdf`, {responseType: 'blob'}); }
}
