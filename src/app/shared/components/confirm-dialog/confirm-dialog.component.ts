import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../../core/services/dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialogService.state().open && dialogService.state().options; as opts) {
      <div class="dialog-backdrop" (click)="onBackdropClick($event)">
        <div class="dialog" [class]="'dialog--' + opts.type" role="alertdialog" aria-modal="true">
          <div class="dialog__icon">
            @switch (opts.type) {
              @case ('danger') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
              }
              @case ('warning') {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 9v4m0 4h.01"/>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              }
              @default {
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4m0-4h.01"/>
                </svg>
              }
            }
          </div>
          <h3 class="dialog__title">{{ opts.title }}</h3>
          <p class="dialog__message">{{ opts.message }}</p>
          <div class="dialog__actions">
            <button class="btn btn--secondary" (click)="dialogService.close(false)">
              {{ opts.cancelText }}
            </button>
            <button class="btn" [class]="'btn--' + opts.type" (click)="dialogService.close(true)">
              {{ opts.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  readonly dialogService = inject(DialogService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialogService.state().open) {
      this.dialogService.close(false);
    }
  }

  @HostListener('document:keydown.enter')
  onEnter(): void {
    if (this.dialogService.state().open) {
      this.dialogService.close(true);
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.dialogService.close(false);
    }
  }
}
