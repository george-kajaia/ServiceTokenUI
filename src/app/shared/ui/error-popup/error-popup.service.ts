import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ErrorPopupState {
  visible: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorPopupService {
  private readonly stateSubject = new BehaviorSubject<ErrorPopupState>({ visible: false, message: '' });
  readonly state$: Observable<ErrorPopupState> = this.stateSubject.asObservable();

  private hideTimer: any = null;

  show(message: string, autoHideMs: number = 8000) {
    const safe = (message ?? '').toString().trim();
    if (!safe) return;

    this.stateSubject.next({ visible: true, message: safe });

    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }

    if (autoHideMs > 0) {
      this.hideTimer = setTimeout(() => this.close(), autoHideMs);
    }
  }

  close() {
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    this.stateSubject.next({ visible: false, message: '' });
  }
}
