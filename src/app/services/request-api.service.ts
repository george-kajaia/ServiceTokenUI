import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Request } from '../models/request.model';
import { RequestDto } from '../models/dtos.model';

@Injectable({ providedIn: 'root' })
export class RequestApiService {
  private baseUrl = `${environment.apiBaseUrl}/Request`;

  constructor(private http: HttpClient) {}

  getAll(companyId: number = -1, status: number = 0): Observable<Request[]> {
    // Backend signature: GetAll(int CompanyId = -1, RequestStatus status = RequestStatus.None)
    return this.http.get<Request[]>(
      `${this.baseUrl}/GetAll?CompanyId=${companyId}&status=${status}`
    );
  }

  getById(requestId: number): Observable<Request> {
    return this.http.get<Request>(`${this.baseUrl}/GetById/${requestId}`);
  }

  create(dto: RequestDto): Observable<Request> {
    return this.http.post<Request>(`${this.baseUrl}/create`, dto);
  }
}
