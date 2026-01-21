import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorPopupService } from './error-popup.service';

@Component({
  selector: 'app-error-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="popup-backdrop" *ngIf="(popup.state$ | async) as s" [class.visible]="s.visible">
      <div class="popup" role="dialog" aria-live="assertive" *ngIf="s.visible">
        <div class="popup-header">
          <span class="title">Error</span>
          <button class="close" type="button" (click)="popup.close()" aria-label="Close">×</button>
        </div>
        <div class="popup-body">{{ s.message }}</div>
      </div>
    </div>
  `,
  styles: [
    `
      .popup-backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding: 24px 12px;
        pointer-events: none;
        z-index: 9999;
      }
      .popup {
        pointer-events: auto;
        width: min(680px, 100%);
        background: #ffffff;
        border: 1px solid rgba(0, 0, 0, 0.12);
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }
      .popup-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        background: rgba(220, 53, 69, 0.08);
      }
      .title {
        font-weight: 700;
      }
      .close {
        border: none;
        background: transparent;
        font-size: 18px;
        cursor: pointer;
        padding: 2px 8px;
        line-height: 1;
      }
      .popup-body {
        padding: 12px;
        white-space: pre-wrap;
        word-break: break-word;
      }
    `
  ]
})
export class ErrorPopupComponent {
  constructor(public popup: ErrorPopupService) {}
}
