import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorPopupComponent } from './shared/ui/error-popup/error-popup.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ErrorPopupComponent],
  template: `
    <router-outlet></router-outlet>
    <app-error-popup></app-error-popup>
  `
})
export class AppComponent {}
