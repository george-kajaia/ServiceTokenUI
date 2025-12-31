import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Investor } from '../models/user.model';
import { InvestorCreateDto } from '../models/dtos.model';

@Injectable({ providedIn: 'root' })
export class InvestorApiService {
  private baseUrl = `${environment.apiBaseUrl}/Investor`;

  constructor(private http: HttpClient) {}

  login(payload: { userName: string; password: string }): Observable<Investor> {
    return this.http.post<Investor>(`${this.baseUrl}/Login`, payload);
  }

  register(dto: InvestorCreateDto): Observable<Investor> {
    // [HttpPost("create")] -> /api/Investor/Create
    return this.http.post<Investor>(`${this.baseUrl}/Create`, dto);
  }
}
