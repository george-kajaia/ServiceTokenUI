import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { InvestorStateService } from '../../../core/state/investor-state.service';
import { CompanyApiService } from '../../../core/api/company-api.service';
import { ServiceTokenApiService } from '../../../core/api/service-token-api.service';
import { ToastService } from '../../../core/services/toast.service';

import { Company } from '../../../shared/models/company.model';
import { ScheduleType } from '../../../shared/models/product.model';
import { ServiceTokenDto, ServiceTokenStatus } from '../../../shared/models/service-token.model';

type MarketplaceTab = 'yourTokens' | 'primaryMarket' | 'secondaryMarket';

@Component({
  selector: 'app-investor-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './investor-marketplace.component.html',
  styleUrls: ['./investor-marketplace.component.scss']
})
export class InvestorMarketplaceComponent implements OnInit {
  activeTab: MarketplaceTab = 'yourTokens';

  investorPublicKey = '';

  companies: Company[] = [];

  // Filters for market tabs
  marketCompanyId: number = -1;
  marketRequestId: number = -1;

  // Data
  yourTokens: ServiceTokenDto[] = [];
  primaryMarketTokens: ServiceTokenDto[] = [];
  secondaryMarketTokens: ServiceTokenDto[] = [];

  loading = false;

  private toast = inject(ToastService);

  constructor(
    private router: Router,
    private investorState: InvestorStateService,
    private companyApi: CompanyApiService,
    private serviceTokenApi: ServiceTokenApiService
  ) {}

  ngOnInit(): void {
    const investor = this.investorState.investor;
    if (!investor) {
      this.router.navigate(['/investor/login']);
      return;
    }

    this.investorPublicKey = investor.publicKey;

    this.loadCompanies();
    this.loadYourTokens();
  }

  setTab(tab: MarketplaceTab) {
    this.activeTab = tab;

    if (tab === 'yourTokens') {
      this.loadYourTokens();
    } else if (tab === 'primaryMarket') {
      this.loadPrimaryMarket();
    } else {
      this.loadSecondaryMarket();
    }
  }

  loadCompanies() {
    this.companyApi.getAll(0, 500, null).subscribe({
      next: list => (this.companies = list ?? []),
      error: err => {
        console.error(err);
        // non-blocking
      }
    });
  }

  // -----------------------------
  // Your tokens
  // -----------------------------
  loadYourTokens(silent = false) {
    this.loading = true;

    this.serviceTokenApi.getInvestorServiceTokens(this.investorPublicKey).subscribe({
      next: list => {
        this.yourTokens = list ?? [];
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
        if (!silent) {
          this.toast.errorWithRetry(
            'Failed to load your service tokens. Please check your connection.',
            () => this.loadYourTokens()
          );
        }
      }
    });
  }

  markForResell(t: ServiceTokenDto) {
    this.loading = true;

    this.serviceTokenApi.markServiceTokenForResell(t.id, t.rowVersion).subscribe({
      next: _ => {
        this.loading = false;
        this.toast.success('Token marked for resell.');
        this.loadYourTokens(true);
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.toast.error('Failed to mark token for resell. Please try again.');
      }
    });
  }

  cancelReselling(t: ServiceTokenDto) {
    this.loading = true;

    this.serviceTokenApi.cancelReselling(t.id, t.rowVersion).subscribe({
      next: _ => {
        this.loading = false;
        this.toast.success('Reselling cancelled.');
        this.loadYourTokens(true);
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.toast.error('Failed to cancel reselling. Please try again.');
      }
    });
  }

  // -----------------------------
  // Primary market
  // -----------------------------
  loadPrimaryMarket(silent = false) {
    this.loading = true;

    this.serviceTokenApi.getPrimaryMarketServiceTokens(this.marketCompanyId, this.marketRequestId).subscribe({
      next: list => {
        this.primaryMarketTokens = list ?? [];
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
        if (!silent) {
          this.toast.errorWithRetry(
            'Failed to load primary market tokens. Please check your connection.',
            () => this.loadPrimaryMarket()
          );
        }
      }
    });
  }

  buyPrimary(t: ServiceTokenDto) {
    this.loading = true;

    this.serviceTokenApi.buyPrimaryServiceToken(t.id, t.rowVersion, this.investorPublicKey).subscribe({
      next: _ => {
        this.loading = false;
        this.toast.success('Token purchased successfully.');
        // After buying: refresh both lists (silent to avoid duplicate toasts)
        this.loadYourTokens(true);
        this.loadPrimaryMarket(true);
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.toast.error('Failed to buy token. It may no longer be available.');
      }
    });
  }

  // -----------------------------
  // Secondary market
  // -----------------------------
  loadSecondaryMarket(silent = false) {
    this.loading = true;

    this.serviceTokenApi
      .getSecondaryMarketServiceTokens(this.investorPublicKey, this.marketCompanyId, this.marketRequestId)
      .subscribe({
        next: list => {
          this.secondaryMarketTokens = list ?? [];
          this.loading = false;
        },
        error: err => {
          console.error(err);
          this.loading = false;
          if (!silent) {
            this.toast.errorWithRetry(
              'Failed to load secondary market tokens. Please check your connection.',
              () => this.loadSecondaryMarket()
            );
          }
        }
      });
  }

  buySecondary(t: ServiceTokenDto) {
    this.loading = true;

    this.serviceTokenApi.buySecondaryServiceToken(t.id, t.rowVersion, this.investorPublicKey).subscribe({
      next: _ => {
        this.loading = false;
        this.toast.success('Token purchased successfully.');
        // After buying: refresh both lists (silent to avoid duplicate toasts)
        this.loadYourTokens(true);
        this.loadSecondaryMarket(true);
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.toast.error('Failed to buy token. It may no longer be available.');
      }
    });
  }

  // -----------------------------
  // Display helpers
  // -----------------------------
  tokenStatusLabel(status: number): string {
    switch (status) {
      case ServiceTokenStatus.Available:
        return 'Available';
      case ServiceTokenStatus.Sold:
        return 'Sold';
      case ServiceTokenStatus.Finished:
        return 'Finished';
      default:
        return `Status ${status}`;
    }
  }

  scheduleTypeLabel(st: ScheduleType): string {
    if (!st) return '-';

    const base = this.schedulePeriodLabel(st.periodType);
    const n = st.periodNumber;
    if (!n || n <= 0) return base;
    return `${base} / ${n}`;
  }

  private schedulePeriodLabel(value: number): string {
    switch (value) {
      case 0:
        return 'None';
      case 1:
        return 'Daily';
      case 2:
        return 'Weekly';
      case 3:
        return 'Monthly';
      case 4:
        return 'Yearly';
      default:
        return `Period ${value}`;
    }
  }
}
