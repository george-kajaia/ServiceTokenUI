import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CompanyApiService } from '../../../core/api/company-api.service';
import { InvestorStateService } from '../../../core/state/investor-state.service';
import { Company } from '../../../shared/models/company.model';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../core/services/toast.service';

interface Bond {
  id: string;
  rowVersion: string;
  companyId: number;
  bondRequestId: number;
  status: number;
  startDate?: string | null;
  endDate?: string | null;
  price: number;
  interestRate: number;
  ownerType: number;
  ownerPublicKey: string;
}

interface BondDto extends Bond {
  companyName: string;
}

type TabKey = 'yourBonds' | 'companiesBonds' | 'secondaryMarket';

@Component({
  selector: 'app-investor-marketplace',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './investor-marketplace.component.html',
  styleUrls: ['./investor-marketplace.component.scss']
})
export class InvestorMarketplaceComponent implements OnInit {
  activeTab: TabKey = 'yourBonds';

  investorPublicKey: string | null = null;

  investorName: string | null = null;

  // Your Bonds (tab 1)
  yourBonds: BondDto[] = [];
  yourBondsLoading = false;

  // Companies Bonds (tab 2)
  companies: Company[] = [];
  companiesLoading = false;
  selectedCompanyId: number | null = null;
  primaryBonds: BondDto[] = [];
  primaryBondsLoading = false;

  // Secondary Market (tab 3)
  secondaryBonds: BondDto[] = [];
  secondaryBondsLoading = false;

  private toast = inject(ToastService);

  // UI state for actions
  markingResellId: string | null = null;
  buyingPrimaryId: string | null = null;
  buyingSecondaryId: string | null = null;

  private bondBaseUrl = `${environment.apiBaseUrl}/Bond`;

  constructor(
    private router: Router,
    private companyApi: CompanyApiService,
    private investorState: InvestorStateService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const investor = this.investorState.investor;
    if (!investor) {
      // If someone opens the page without login, redirect to login
      this.router.navigate(['/investor/login']);
      return;
    }

    this.investorPublicKey = investor.publicKey;
    this.investorName = investor.userName;

    // Load initial data for all tabs
    this.loadYourBonds();
    this.loadCompanies();
    this.loadSecondaryBonds();
  }

  setTab(tab: TabKey): void {
    this.activeTab = tab;
  }

  // --- Tab 1: Your Bonds ---

  private loadYourBonds(): void {
    if (!this.investorPublicKey) {
      return;
    }

    this.yourBondsLoading = true;

    this.http
      .get<BondDto[]>(`${this.bondBaseUrl}/GetInvestorBonds`, {
        params: { investorPublicKey: this.investorPublicKey }
      })
      .subscribe({
        next: bonds => {
          this.yourBondsLoading = false;
          this.yourBonds = bonds || [];
        },
        error: err => {
          console.error(err);
          this.yourBondsLoading = false;
          this.toast.errorWithRetry(
            'Failed to load your bonds. Please check your connection.',
            () => this.loadYourBonds()
          );
        }
      });
  }

  markForResell(bond: BondDto): void {
    this.markingResellId = bond.id;

    this.http
      .get<Bond>(`${this.bondBaseUrl}/MarkBondForResell`, {
        params: { bondId: bond.id }
      })
      .subscribe({
        next: _ => {
          this.markingResellId = null;
          this.toast.success('Bond marked for resell.');
          // Refresh your bonds after marking for resell
          this.loadYourBonds();
        },
        error: err => {
          console.error(err);
          this.markingResellId = null;
          this.toast.error('Could not mark bond for resell. Please try again.');
        }
      });
  }

  // --- Tab 2: Companies Bonds (Primary Market) ---

  private loadCompanies(): void {
    this.companiesLoading = true;

    this.companyApi.getAll().subscribe({
      next: companies => {
        this.companiesLoading = false;
        this.companies = companies || [];
      },
      error: err => {
        console.error(err);
        this.companiesLoading = false;
        this.toast.errorWithRetry(
          'Failed to load companies. Please check your connection.',
          () => this.loadCompanies()
        );
      }
    });
  }

  onCompanyChange(): void {
    this.primaryBonds = [];

    if (this.selectedCompanyId == null) {
      return;
    }

    this.loadPrimaryBonds(this.selectedCompanyId);
  }

  private loadPrimaryBonds(companyId: number): void {
    this.primaryBondsLoading = true;

    this.http
      .get<BondDto[]>(`${this.bondBaseUrl}/GetPrimaryMarketBonds`, {
        params: { companyId: companyId.toString() }
      })
      .subscribe({
        next: bonds => {
          this.primaryBondsLoading = false;
          this.primaryBonds = bonds || [];
        },
        error: err => {
          console.error(err);
          this.primaryBondsLoading = false;
          this.toast.error('Failed to load primary market bonds. Please try again.');
        }
      });
  }

  buyPrimary(bond: BondDto): void {
    if (!this.investorPublicKey) {
      return;
    }

    this.buyingPrimaryId = bond.id;

    this.http
      .get<Bond[]>(`${this.bondBaseUrl}/BuyPrimaryBond`, {
        params: {
          bondId: bond.id,
          investorPublicKey: this.investorPublicKey
        }
      })
      .subscribe({
        next: _ => {
          this.buyingPrimaryId = null;
          this.toast.success('Bond purchased successfully.');
          // Refresh your bonds and current company bonds
          this.loadYourBonds();
          if (this.selectedCompanyId != null) {
            this.loadPrimaryBonds(this.selectedCompanyId);
          }
        },
        error: err => {
          console.error(err);
          this.buyingPrimaryId = null;
          this.toast.error('Could not complete purchase. The bond may no longer be available.');
        }
      });
  }

  // --- Tab 3: Secondary Market ---

  private loadSecondaryBonds(): void {
    if (!this.investorPublicKey) {
      return;
    }

    this.secondaryBondsLoading = true;

    this.http
      .get<BondDto[]>(`${this.bondBaseUrl}/GetSecondaryMarketBonds`, {
        params: { investorPublicKey: this.investorPublicKey }
      })
      .subscribe({
        next: bonds => {
          this.secondaryBondsLoading = false;
          this.secondaryBonds = bonds || [];
        },
        error: err => {
          console.error(err);
          this.secondaryBondsLoading = false;
          this.toast.errorWithRetry(
            'Failed to load secondary market bonds. Please check your connection.',
            () => this.loadSecondaryBonds()
          );
        }
      });
  }

  buySecondary(bond: BondDto): void {
    if (!this.investorPublicKey) {
      return;
    }

    this.buyingSecondaryId = bond.id;

    this.http
      .get<Bond>(`${this.bondBaseUrl}/BuySecondaryBond`, {
        params: {
          bondId: bond.id,
          newInvestorPublicKey: this.investorPublicKey
        }
      })
      .subscribe({
        next: _ => {
          this.buyingSecondaryId = null;
          this.toast.success('Bond purchased successfully.');
          // Refresh your bonds and the secondary market
          this.loadYourBonds();
          this.loadSecondaryBonds();
        },
        error: err => {
          console.error(err);
          this.buyingSecondaryId = null;
          this.toast.error('Could not complete purchase. The bond may no longer be available.');
        }
      });
  }
}