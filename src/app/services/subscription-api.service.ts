import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {
  Invoice, Page, PlanRequest, Subscription, SubscriptionAudience, SubscriptionHistory, SubscriptionPlan,
  SubscriptionStatus
} from '../models/api.models';

@Injectable({providedIn: 'root'})
export class SubscriptionApiService {
  private readonly api = environment.apiBaseUrl;
  constructor(private readonly http: HttpClient) {}

  plans(audience: SubscriptionAudience) {
    return this.http.get<SubscriptionPlan[]>(`${this.api}/subscriptions/plans`, {params: {audience}});
  }
  current(audience: SubscriptionAudience) { return this.http.get<Subscription>(`${this.api}/${audience.toLowerCase()}/subscription`); }
  subscribe(audience: SubscriptionAudience, planCode: string, autoRenew = true) {
    return this.http.post<Subscription>(`${this.api}/${audience.toLowerCase()}/subscription`, {planCode, autoRenew});
  }
  changePlan(audience: SubscriptionAudience, action: 'upgrade' | 'downgrade', planCode: string, autoRenew = true) {
    return this.http.post<Subscription>(`${this.api}/${audience.toLowerCase()}/subscription/${action}`, {planCode, autoRenew});
  }
  renew(audience: SubscriptionAudience) { return this.http.post<Subscription>(`${this.api}/${audience.toLowerCase()}/subscription/renew`, {}); }
  cancel(audience: SubscriptionAudience) { return this.http.post<Subscription>(`${this.api}/${audience.toLowerCase()}/subscription/cancel`, {}); }
  history(audience: SubscriptionAudience, page = 0, size = 20) {
    return this.http.get<Page<SubscriptionHistory>>(`${this.api}/${audience.toLowerCase()}/subscription/history`, {params: {page, size}});
  }
  invoices(audience: SubscriptionAudience, page = 0, size = 20) {
    return this.http.get<Page<Invoice>>(`${this.api}/${audience.toLowerCase()}/subscription/invoices`, {params: {page, size}});
  }
  adminPlans() { return this.http.get<SubscriptionPlan[]>(`${this.api}/admin/subscription/plans`); }
  createPlan(value: PlanRequest) { return this.http.post<SubscriptionPlan>(`${this.api}/admin/subscription/plans`, value); }
  updatePlan(id: string, value: PlanRequest) { return this.http.patch<SubscriptionPlan>(`${this.api}/admin/subscription/plans/${id}`, value); }
  companySubscriptions(page = 0, size = 20) {
    return this.http.get<Page<Subscription>>(`${this.api}/admin/subscription/company-subscriptions`, {params: {page, size}});
  }
  updateCompanySubscription(id: string, value: {status?: SubscriptionStatus; planCode?: string; endsAt?: string}) {
    return this.http.patch<Subscription>(`${this.api}/admin/subscription/company-subscriptions/${id}`, value);
  }
}

export type {PlanRequest};
