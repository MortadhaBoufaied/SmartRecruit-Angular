import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { apiError } from '../../core/api-error';
import { Notification } from '../../models/api.models';
import { NotificationApiService } from '../../services/notification-api.service';

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-intro"><span class="page-kicker">YOUR INBOX</span><h1>Updates that matter.</h1><p>Application, interview and account updates appear here.</p></div>
    <section class="inbox-summary"><div class="inbox-count"><span class="inbox-icon" aria-hidden="true">◉</span><div><strong>{{unreadCount}}</strong><small>Unread on this page</small></div></div><div class="inbox-filter"><button type="button" [class.active]="filter==='ALL'" (click)="filter='ALL'">All</button><button type="button" [class.active]="filter==='UNREAD'" (click)="filter='UNREAD'">Unread</button></div></section>
    <div class="alert-error" role="alert" *ngIf="error"><span>{{error}}</span><button class="secondary" type="button" (click)="load()">Try again</button></div>
    <div class="state" *ngIf="loading"><span class="loading-dots" aria-hidden="true"></span>Loading your inbox…</div>
    <div class="empty-state" *ngIf="!loading && !error && !items.length"><div class="empty-illustration" aria-hidden="true">◉</div><h3>You’re all caught up</h3><p>New application and interview updates will appear here.</p></div>
    <div class="empty-state compact-empty" *ngIf="!loading && items.length && !visibleItems.length"><h3>No unread updates</h3><p>Everything on this page has been read.</p><button class="secondary" type="button" (click)="filter='ALL'">View all updates</button></div>
    <div class="notifications" *ngIf="!loading && visibleItems.length">
      <article *ngFor="let item of visibleItems; trackBy: trackNotification" [class.unread]="!item.readAt">
        <div class="notification-symbol" [class.unread-symbol]="!item.readAt" aria-hidden="true">{{symbol(item.type)}}</div>
        <div class="notification-content"><div class="notification-meta"><span class="pill neutral">{{label(item.type)}}</span><span class="notification-unread" *ngIf="!item.readAt"><i></i>New</span></div><h3>{{item.title}}</h3><p>{{item.content}}</p><small>{{item.createdAt | date:'medium'}}</small></div>
        <div class="notification-actions"><button class="secondary" type="button" *ngIf="!item.readAt" (click)="setRead(item,true)" [disabled]="busyId===item.id">{{busyId===item.id?'Saving…':'Mark read'}}</button><button class="secondary" type="button" *ngIf="item.readAt" (click)="setRead(item,false)" [disabled]="busyId===item.id">{{busyId===item.id?'Saving…':'Mark unread'}}</button><button class="icon-button danger" type="button" [attr.aria-label]="'Delete notification: '+item.title" title="Delete notification" (click)="remove(item)" [disabled]="busyId===item.id">×</button></div>
      </article>
    </div>
    <div class="pagination" *ngIf="!loading && totalPages>1"><button class="secondary" (click)="goToPage(page-1)" [disabled]="page===0">← Previous</button><span>Page {{page+1}} of {{totalPages}}</span><button class="secondary" (click)="goToPage(page+1)" [disabled]="page+1>=totalPages">Next →</button></div>
  `
})
export class NotificationsComponent implements OnInit {
  items: Notification[] = [];
  loading = true;
  page = 0;
  totalPages = 0;
  busyId = '';
  error = '';
  filter: 'ALL' | 'UNREAD' = 'ALL';
  constructor(private readonly api: NotificationApiService) {}
  ngOnInit() { this.load(); }
  get unreadCount() { return this.items.filter(item => !item.readAt).length; }
  get visibleItems() { return this.filter === 'UNREAD' ? this.items.filter(item => !item.readAt) : this.items; }
  trackNotification(_: number, item: Notification) { return item.id; }
  label(type: string) { return (type || 'UPDATE').replaceAll('_',' ').toLowerCase().replace(/\b\w/g, letter => letter.toUpperCase()); }
  symbol(type: string) { return /INTERVIEW/i.test(type) ? '◷' : /APPLICATION|JOB/i.test(type) ? '↗' : '◉'; }
  goToPage(page: number) { this.page = page; this.load(); }

  load() {
    this.loading = true; this.error = '';
    this.api.list(this.page, 20).subscribe({ next: result => { this.items = result.content ?? []; this.totalPages = result.totalPages ?? 0; this.loading = false; }, error: error => { this.error = apiError(error, 'Your inbox could not be loaded.'); this.loading = false; } });
  }

  setRead(item: Notification, read: boolean) {
    if (this.busyId) return;
    this.busyId = item.id; this.error = '';
    const request = read ? this.api.read(item.id) : this.api.unread(item.id);
    request.subscribe({ next: updated => { Object.assign(item, updated); this.busyId = ''; }, error: error => { this.error = apiError(error, 'The notification could not be updated.'); this.busyId = ''; } });
  }

  remove(item: Notification) {
    if (this.busyId || !confirm(`Delete “${item.title}” from your inbox?`)) return;
    this.busyId = item.id; this.error = '';
    this.api.delete(item.id).subscribe({ next: () => { this.items = this.items.filter(value => value.id !== item.id); this.busyId = ''; if (!this.items.length && this.page > 0) this.goToPage(this.page - 1); }, error: error => { this.error = apiError(error, 'The notification could not be deleted.'); this.busyId = ''; } });
  }
}
