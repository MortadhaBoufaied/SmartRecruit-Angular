import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {Notification, Page} from '../models/api.models';

@Injectable({providedIn: 'root'})
export class NotificationApiService {
  private readonly api = `${environment.apiBaseUrl}/notifications`;
  constructor(private readonly http: HttpClient) {}
  list(page = 0, size = 20) { return this.http.get<Page<Notification>>(this.api, {params: {page, size}}); }
  read(id: string) { return this.http.patch<Notification>(`${this.api}/${id}/read`, null); }
  unread(id: string) { return this.http.patch<Notification>(`${this.api}/${id}/unread`, null); }
  delete(id: string) { return this.http.delete<void>(`${this.api}/${id}`); }
}
