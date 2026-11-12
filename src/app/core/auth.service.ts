import {HttpClient} from '@angular/common/http';
import {Injectable, computed, signal} from '@angular/core';
import {tap} from 'rxjs';
import {environment} from '../../environments/environment';
import {RegisterRequest, TokenResponse, UserView} from '../models/api.models';
import {TokenStorageService} from './token-storage.service';

@Injectable({providedIn: 'root'})
export class AuthService {
  private readonly api = environment.apiBaseUrl;
  readonly user = signal<UserView | null>(null);
  readonly authenticated = computed(() => !!this.tokens.token && !this.tokens.expired);
  readonly roles = computed(() => this.tokens.roles);

  constructor(private readonly http: HttpClient, private readonly tokens: TokenStorageService) {}

  login(email: string, password: string) {
    return this.http.post<TokenResponse>(`${this.api}/auth/login`, {email, password})
      .pipe(tap(response => this.tokens.set(response.accessToken)));
  }

  registerCandidate(value: RegisterRequest) {
    const {confirmPassword, ...request} = value;
    return this.http.post<UserView>(`${this.api}/auth/register/candidate`, request);
  }

  registerRecruiter(value: RegisterRequest, proof: File) {
    const form = new FormData();
    const {confirmPassword, ...request} = value;
    form.append('registration', new Blob([JSON.stringify(request)], {type: 'application/json'}));
    form.append('employmentProof', proof, proof.name);
    return this.http.post<UserView>(`${this.api}/auth/register/recruiter`, form);
  }

  me() {
    return this.http.get<UserView>(`${this.api}/users/me`).pipe(tap(profile => this.user.set(profile)));
  }

  update(value: Partial<RegisterRequest>) {
    return this.http.patch<UserView>(`${this.api}/users/me`, value).pipe(tap(profile => this.user.set(profile)));
  }

  logout() {
    this.tokens.clear();
    this.user.set(null);
  }

  hasRole(role: string) { return this.roles().includes(role as any); }
}
