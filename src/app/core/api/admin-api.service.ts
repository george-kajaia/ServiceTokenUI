import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdminUser } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private baseUrl = `${environment.apiBaseUrl}/User`;

  constructor(private http: HttpClient) {}

  login(payload: { userName: string; password: string }): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.baseUrl}/Login`, payload);
  }
}
