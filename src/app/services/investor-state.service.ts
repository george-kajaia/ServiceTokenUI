import { Injectable } from '@angular/core';
import { Investor } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class InvestorStateService {
  private readonly STORAGE_KEY = 'btp_investor_state';
  private _investor: Investor | null = null;

  constructor() {
    // Try to hydrate investor from localStorage on service creation
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Investor;
          if (parsed && (parsed as any).publicKey) {
            this._investor = parsed;
          }
        }
      }
    } catch {
      // Ignore storage errors (e.g. disabled storage)
      this._investor = null;
    }
  }

  get investor(): Investor | null {
    return this._investor;
  }

  set investor(value: Investor | null) {
    this._investor = value;

    // Persist or clear from localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (value) {
          window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(value));
        } else {
          window.localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  clear(): void {
    this.investor = null;
  }
}
