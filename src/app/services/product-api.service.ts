import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private baseUrl = `${environment.apiBaseUrl}/Product`;

  constructor(private http: HttpClient) {}

  getAll(skip: number = 0, take: number = 50, search: string | null = null): Observable<Product[]> {
    let params = new HttpParams()
      .set('skip', skip)
      .set('take', take);

    if (search && search.trim().length > 0) {
      params = params.set('search', search.trim());
    }

    return this.http.get<Product[]>(`${this.baseUrl}/GetAll`, { params });
  }

  getById(prodId: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/GetById/${prodId}`);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(`${this.baseUrl}/Create`, product);
  }

  update(prodId: number, newProduct: Product): Observable<Product> {
    // Backend signature: Update(int prodId, [FromBody] Product newProduct) (prodId bound from query string)
    return this.http.put<Product>(`${this.baseUrl}/Update?prodId=${prodId}`, newProduct);
  }

  delete(prodId: number): Observable<void> {
    // Backend signature: Delete(int prodId) (prodId bound from query string)
    return this.http.delete<void>(`${this.baseUrl}/Delete?prodId=${prodId}`);
  }
}
