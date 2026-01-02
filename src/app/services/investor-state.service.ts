import { Injectable } from '@angular/core';
import { Investor } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class InvestorStateService {
  investor: Investor | null = null;
}
