import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ErrorPopupComponent } from './shared/ui/error-popup/error-popup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, ConfirmDialogComponent, ErrorPopupComponent],
  template: `
    <router-outlet></router-outlet>
    <app-toast></app-toast>
    <app-confirm-dialog></app-confirm-dialog>
    <app-error-popup></app-error-popup>
  `
})
export class AppComponent {}
