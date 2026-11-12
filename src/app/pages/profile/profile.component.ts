import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { apiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { UserView } from '../../models/api.models';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-intro"><span class="page-kicker">ACCOUNT SETTINGS</span><h1>Make your profile yours.</h1><p>Keep your contact details current so important hiring and application updates reach you.</p></div>
    <div class="state" *ngIf="loading"><span class="loading-dots" aria-hidden="true"></span>Loading your profile…</div>
    <div class="alert-error" role="alert" *ngIf="error"><span>{{error}}</span><button class="secondary" type="button" (click)="load()">Try again</button></div>
    <div class="auth-message success" role="status" *ngIf="message">{{message}}</div>
    <div class="profile-layout" *ngIf="!loading && user">
      <aside class="profile-aside"><div class="profile-avatar">{{initials}}</div><span class="pill neutral">{{roleLabel}}</span><h2>{{user.fullName}}</h2><p>{{user.email}}</p><small>Member since {{user.createdAt | date:'mediumDate'}}</small></aside>
      <form class="panel profile-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div><span class="eyebrow">PERSONAL DETAILS</span><h2>Contact information</h2><p>These details are private to your account.</p></div>
        <label>Email address<input [value]="user.email" type="email" readonly aria-describedby="email-note"><small id="email-note" class="input-hint">Email address changes are managed by account support.</small></label>
        <label>Full name<input formControlName="fullName" autocomplete="name" placeholder="Your full name"></label>
        <small class="field-error" *ngIf="form.controls.fullName.touched && form.controls.fullName.invalid">Enter a name up to 100 characters.</small>
        <label>Phone number<input formControlName="phone" type="tel" autocomplete="tel" placeholder="+216 …"></label>
        <div class="grid2"><label>City<input formControlName="city" autocomplete="address-level2" placeholder="City"></label><label>Country<input formControlName="country" autocomplete="country-name" placeholder="Country"></label></div>
        <label>Address<input formControlName="address" autocomplete="street-address" placeholder="Street and number"></label>
        <div class="form-actions"><button class="primary" type="submit" [disabled]="form.invalid || saving">{{saving?'Saving…':'Save changes'}}</button><button class="secondary" type="button" (click)="reset()" [disabled]="saving || !form.dirty">Discard changes</button></div>
      </form>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  user: UserView | null = null;
  loading = true;
  saving = false;
  message = '';
  error = '';
  form = this.fb.nonNullable.group({ fullName: ['', [Validators.required, Validators.maxLength(100)]], phone: ['', Validators.maxLength(32)], address: ['', Validators.maxLength(255)], city: ['', Validators.maxLength(100)], country: ['', Validators.maxLength(100)] });

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService) {}
  ngOnInit() { this.load(); }
  get initials() { return (this.user?.fullName || 'SR').trim().split(/\s+/).slice(0,2).map(name => name[0]?.toUpperCase()).join(''); }
  get roleLabel() { const role = this.user?.role || ''; return role === 'PLATFORM_ADMINISTRATOR' ? 'Platform administrator' : role.charAt(0) + role.slice(1).toLowerCase(); }

  load() {
    this.loading = true; this.error = '';
    this.auth.me().subscribe({ next: user => { this.user = user; this.form.reset({ fullName:user.fullName || '', phone:user.phone || '', address:user.address || '', city:user.city || '', country:user.country || '' }); this.loading = false; }, error: error => { this.error = apiError(error, 'Your profile could not be loaded.'); this.loading = false; } });
  }

  reset() { if (this.user) this.form.reset({ fullName:this.user.fullName || '', phone:this.user.phone || '', address:this.user.address || '', city:this.user.city || '', country:this.user.country || '' }); this.message = ''; this.error = ''; }

  save() {
    this.error = ''; this.message = '';
    if (this.form.invalid || this.saving) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const value = this.form.getRawValue();
    this.auth.update({...value, fullName:value.fullName.trim()}).subscribe({ next: user => { this.user = user; this.form.markAsPristine(); this.message = 'Your profile has been updated.'; this.saving = false; }, error: error => { this.error = apiError(error, 'Your profile could not be saved.'); this.saving = false; } });
  }
}
