import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { apiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { RegisterRequest } from '../../models/api.models';

type AuthMode = 'login' | 'signup';
type SignupRole = 'CANDIDATE' | 'RECRUITER';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <main class="auth">
      <a class="skip-link" href="#auth-form-card">Skip to account form</a>
      <section class="auth-story">
        <a class="brand" routerLink="/jobs" aria-label="SmartRecruit home">
          <i class="brand-mark">SR</i><span class="brand-copy"><span class="brand-name">SmartRecruit</span><small class="brand-caption">Work that moves you forward</small></span>
        </a>
        <div class="auth-story-copy">
          <span class="hero-eyebrow">A clearer way to move forward</span>
          <h1 *ngIf="mode === 'login'">Your next step starts here.</h1>
          <h1 *ngIf="mode === 'signup'">Make room for what’s next.</h1>
          <p>Explore opportunities, bring your experience into focus and keep every important step in one place.</p>
          <div class="auth-benefits">
            <span><i>✓</i> Browse roles and keep your search organized</span>
            <span><i>✓</i> Build a stronger profile with CV insights</span>
            <span><i>✓</i> Follow applications and updates in one workspace</span>
          </div>
        </div>
        <small class="auth-story-foot">Thoughtful tools for better hiring journeys.</small>
      </section>

      <section class="auth-form-side">
        <div class="auth-card" id="auth-form-card">
          <a class="auth-top-link" routerLink="/jobs">← Back to opportunities</a>
          <ng-container *ngIf="mode === 'login'; else signupView">
            <span class="eyebrow">WELCOME BACK</span>
            <h2>Sign in to your workspace</h2>
            <p>Pick up where you left off.</p>
            <form class="auth-form" [formGroup]="loginForm" (ngSubmit)="login()" novalidate>
              <label>Email address
                <input type="email" formControlName="email" autocomplete="email" placeholder="you@example.com" [attr.aria-invalid]="showLoginEmailError">
              </label>
              <small class="field-error" *ngIf="showLoginEmailError">Enter a valid email address.</small>
              <label>Password
                <input type="password" formControlName="password" autocomplete="current-password" placeholder="Your password">
              </label>
              <small class="field-error" *ngIf="loginForm.controls.password.touched && loginForm.controls.password.invalid">Enter your password to continue.</small>
              <div class="auth-message error" role="alert" *ngIf="errorMessage">{{errorMessage}}</div>
              <button class="primary wide" type="submit" [disabled]="busy">{{busy ? 'Signing in…' : 'Sign in'}}</button>
            </form>
            <div class="auth-links"><span>New to SmartRecruit?</span><button type="button" (click)="setMode('signup')">Create an account</button></div>
          </ng-container>

          <ng-template #signupView>
            <span class="eyebrow">GET STARTED</span>
            <h2>Create your account</h2>
            <p>Choose how you’ll use SmartRecruit. You can browse public opportunities without an account.</p>
            <div class="auth-links role-choice" aria-label="Account type">
              <button type="button" [class.selected]="signupRole === 'CANDIDATE'" [attr.aria-pressed]="signupRole === 'CANDIDATE'" (click)="selectRole('CANDIDATE')">I’m looking for work</button>
              <button type="button" [class.selected]="signupRole === 'RECRUITER'" [attr.aria-pressed]="signupRole === 'RECRUITER'" (click)="selectRole('RECRUITER')">I’m hiring</button>
            </div>
            <div class="auth-message success" role="status" *ngIf="successMessage">{{successMessage}}</div>
            <form class="auth-form" [formGroup]="signupForm" (ngSubmit)="signup()" novalidate>
              <label>Full name
                <input type="text" formControlName="fullName" autocomplete="name" placeholder="Your name">
              </label>
              <small class="field-error" *ngIf="signupForm.controls.fullName.touched && signupForm.controls.fullName.invalid">Enter your full name (up to 100 characters).</small>
              <label>Email address
                <input type="email" formControlName="email" autocomplete="email" placeholder="you@example.com">
              </label>
              <small class="field-error" *ngIf="signupForm.controls.email.touched && signupForm.controls.email.invalid">Enter a valid email address.</small>
              <div class="grid2">
                <label>Password
                  <input type="password" formControlName="password" autocomplete="new-password" placeholder="12 characters minimum">
                </label>
                <label>Confirm password
                  <input type="password" formControlName="confirmPassword" autocomplete="new-password" placeholder="Repeat password">
                </label>
              </div>
                <small class="input-hint">Use 12–72 characters. Passwords are stored securely.</small>
              <small class="field-error" *ngIf="signupForm.controls.password.touched && signupForm.controls.password.invalid">Your password must contain 12–72 characters.</small>
              <small class="field-error" *ngIf="signupForm.controls.confirmPassword.touched && passwordMismatch">Passwords do not match.</small>
              <ng-container *ngIf="signupRole === 'RECRUITER'">
                <label>Employment proof <span class="required-mark">Required</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-required="true" (change)="onProofSelected($event)">
                </label>
                <small class="input-hint">PDF, JPG or PNG · up to 10 MB. A platform administrator reviews recruiter accounts.</small>
                <small class="field-error" *ngIf="proofError">{{proofError}}</small>
              </ng-container>
              <div class="auth-message error" role="alert" *ngIf="errorMessage">{{errorMessage}}</div>
              <button class="primary wide" type="submit" [disabled]="busy || !signupReady">{{busy ? 'Creating account…' : signupRole === 'RECRUITER' ? 'Submit for review' : 'Create candidate account'}}</button>
            </form>
            <div class="auth-links"><span>Already have an account?</span><button type="button" (click)="setMode('login')">Sign in</button></div>
          </ng-template>
        </div>
      </section>
    </main>
  `
})
export class AuthComponent implements OnInit {
  mode: AuthMode = 'login';
  signupRole: SignupRole = 'CANDIDATE';
  busy = false;
  errorMessage = '';
  successMessage = '';
  proof: File | null = null;
  proofError = '';

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    password: ['', Validators.required]
  });
  readonly signupForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    password: ['', [Validators.required, Validators.minLength(12), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required]
  });

  constructor(private readonly fb: FormBuilder, private readonly auth: AuthService, private readonly router: Router, private readonly route: ActivatedRoute) {}

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('mode') === 'signup') this.mode = 'signup';
  }

  get showLoginEmailError() { const control = this.loginForm.controls.email; return control.touched && control.invalid; }
  get passwordMismatch() { return !!this.signupForm.controls.confirmPassword.value && this.signupForm.controls.password.value !== this.signupForm.controls.confirmPassword.value; }
  get signupReady() { return this.signupForm.valid && !this.passwordMismatch && (this.signupRole === 'CANDIDATE' || !!this.proof); }

  setMode(mode: AuthMode) {
    this.mode = mode;
    this.errorMessage = '';
    this.successMessage = '';
  }

  selectRole(role: SignupRole) {
    this.signupRole = role;
    this.proofError = '';
    this.errorMessage = '';
  }

  onProofSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.proofError = '';
    this.proof = null;
    if (!file) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type) && !/\.(pdf|jpe?g|png)$/i.test(file.name)) {
      this.proofError = 'Choose a PDF, JPG or PNG file.';
      input.value = '';
    } else if (file.size > 10 * 1024 * 1024) {
      this.proofError = 'The file must be 10 MB or smaller.';
      input.value = '';
    } else {
      this.proof = file;
    }
  }

  login() {
    this.errorMessage = '';
    if (this.loginForm.invalid || this.busy) { this.loginForm.markAllAsTouched(); return; }
    const value = this.loginForm.getRawValue();
    this.busy = true;
    this.auth.login(value.email.trim(), value.password).subscribe({
      next: () => {
        this.busy = false;
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        void this.router.navigateByUrl(returnUrl?.startsWith('/') ? returnUrl : '/dashboard');
      },
      error: error => { this.errorMessage = apiError(error, 'We could not sign you in. Check your details and try again.'); this.busy = false; }
    });
  }

  signup() {
    this.errorMessage = '';
    if (!this.signupReady || this.busy) { this.signupForm.markAllAsTouched(); return; }
    const value = this.signupForm.getRawValue();
    const request: RegisterRequest = { email: value.email.trim(), password: value.password, confirmPassword: value.confirmPassword, fullName: value.fullName.trim() };
    this.busy = true;
    const request$ = this.signupRole === 'RECRUITER'
      ? this.auth.registerRecruiter(request, this.proof!)
      : this.auth.registerCandidate(request);
    request$.subscribe({
      next: () => {
        this.busy = false;
        this.successMessage = this.signupRole === 'RECRUITER'
          ? 'Your recruiter account has been submitted for review. We’ll update you when it is approved.'
          : 'Your account is ready. Sign in to complete your profile and upload your CV.';
        this.signupForm.reset();
        this.proof = null;
      },
      error: error => { this.errorMessage = apiError(error, 'We could not create your account. Please try again.'); this.busy = false; }
    });
  }
}
