import { Injectable } from '@angular/core';
import { AdminUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminStateService {
  admin: AdminUser | null = null;
}
