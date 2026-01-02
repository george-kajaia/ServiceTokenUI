import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Company, CompanyUser } from '../models/company.model';
import { CompanyCreateDto } from '../models/dtos.model';

@Injectable({ providedIn: 'root' })
export class CompanyApiService {
  private baseUrl = `${environment.apiBaseUrl}/Company`;

  constructor(private http: HttpClient) {}

  login(payload: { userName: string; password: string }): Observable<CompanyUser> {
    console.log(`${this.baseUrl}/Login`);
    return this.http.post<CompanyUser>(`${this.baseUrl}/Login`, payload);
  }

  register(dto: CompanyCreateDto): Observable<Company> {
    return this.http.post<Company>(`${this.baseUrl}/Create`, dto);
  }

  getById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.baseUrl}/GetById/${id}`);
  }

  getAll(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.baseUrl}/GetAll`);
  }

  approveCompany(companyId: number): Observable<Company> {
    return this.http.patch<Company>(`${this.baseUrl}/Approve?CompanyId=${companyId}`, null);
  }
}
