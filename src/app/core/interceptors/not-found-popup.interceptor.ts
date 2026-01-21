import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorPopupService } from '../../shared/ui/error-popup/error-popup.service';

@Injectable()
export class NotFoundPopupInterceptor implements HttpInterceptor {
  constructor(private popup: ErrorPopupService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 404) {
          const message = this.extractMessage(err) || 'Not found.';
          this.popup.show(message);
        }
        return throwError(() => err);
      })
    );
  }

  private extractMessage(err: HttpErrorResponse): string {
    // ASP.NET Core NotFound("...") typically returns text/plain.
    const body: any = err.error;

    if (typeof body === 'string' && body.trim()) return body.trim();

    if (body && typeof body === 'object') {
      // ProblemDetails shape
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      const detail = typeof body.detail === 'string' ? body.detail.trim() : '';
      if (title && detail) return `${title}: ${detail}`;
      if (detail) return detail;
      if (title) return title;

      // Custom shapes
      const msg = typeof body.message === 'string' ? body.message.trim() : '';
      if (msg) return msg;

      const text = typeof body.text === 'string' ? body.text.trim() : '';
      if (text) return text;
    }

    return (err.message ?? '').toString();
  }
}
