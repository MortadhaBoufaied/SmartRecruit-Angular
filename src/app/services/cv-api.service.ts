import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {CandidateCv, CvAnalysis, JobRecommendation} from '../models/api.models';

@Injectable({providedIn: 'root'})
export class CvApiService {
  private readonly api = `${environment.apiBaseUrl}/candidate`;
  constructor(private readonly http: HttpClient) {}

  list() { return this.http.get<CandidateCv[]>(`${this.api}/cvs`); }
  one(id: string) { return this.http.get<CandidateCv>(`${this.api}/cvs/${id}`); }
  upload(file: File) {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.http.post<CandidateCv>(`${this.api}/cvs`, form);
  }
  download(id: string) { return this.http.get(`${this.api}/cvs/${id}/download`, {responseType: 'blob'}); }
  scan(id: string, jobDescription?: string) {
    return this.http.post<CvAnalysis>(`${this.api}/cvs/${id}/ats-scan`, {jobDescription: jobDescription || null});
  }
  recommendations() { return this.http.get<JobRecommendation[]>(`${this.api}/recommendations`); }
  delete(id: string) { return this.http.delete<void>(`${this.api}/cvs/${id}`); }
}
