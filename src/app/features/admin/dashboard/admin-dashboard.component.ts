import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminStateService } from '../../../core/state/admin-state.service';
import { CompanyApiService } from '../../../core/api/company-api.service';
import { BondRequestApiService } from '../../../core/api/bond-request-api.service';
import { Company, BondRequest } from '../../../shared/models/company.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'companies' | 'BondRequests' = 'companies';

  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  companyFilter = {
    name: '',
    taxCode: '',
    status: '' as '' | '0' | '1'
  };

  BondRequests: BondRequest[] = [];
  filteredBondRequests: BondRequest[] = [];
  bondFilter = {
    companyId: '',
    status: '' as '' | '1' | '2'
  };

  private toast = inject(ToastService);

  constructor(
    private adminState: AdminStateService,
    private router: Router,
    private companyApi: CompanyApiService,
    private BondRequestApi: BondRequestApiService
  ) {}

  ngOnInit(): void {
    if (!this.adminState.admin) {
      this.router.navigate(['/admin/login']);
      return;
    }
    this.loadCompanies();
  }

  setTab(tab: 'companies' | 'BondRequests') {
    this.activeTab = tab;
    if (tab === 'companies') {
      this.loadCompanies();
    }
  }

  // Companies tab
  loadCompanies() {
    this.companyApi.getAll().subscribe({
      next: list => {
        this.companies = list;
        this.applyCompanyFilter();
      },
      error: err => {
        console.error(err);
        this.toast.errorWithRetry(
          'Failed to load companies. Please check your connection.',
          () => this.loadCompanies()
        );
      }
    });
  }

  applyCompanyFilter() {
    this.filteredCompanies = this.companies.filter(c => {
      const matchesName =
        !this.companyFilter.name ||
        c.name.toLowerCase().includes(this.companyFilter.name.toLowerCase());
      const matchesTax =
        !this.companyFilter.taxCode ||
        c.taxCode.toLowerCase().includes(this.companyFilter.taxCode.toLowerCase());
      const matchesStatus =
        !this.companyFilter.status || c.status === Number(this.companyFilter.status);
      return matchesName && matchesTax && matchesStatus;
    });
  }

  clearCompanyFilter() {
    this.companyFilter = { name: '', taxCode: '', status: '' };
    this.applyCompanyFilter();
  }

  approveCompany(company: Company) {
    this.companyApi.approveCompany(company.id).subscribe({
      next: updated => {
        company.status = updated.status;
        this.applyCompanyFilter();
        this.toast.success('Company approved successfully.');
      },
      error: err => {
        console.error(err);
        this.toast.error('Could not approve company. Please try again.');
      }
    });
  }

  // bond Requests tab
  loadBondRequests() {
    this.BondRequests = [];
    this.filteredBondRequests = [];
    
    let cid = -1;
    if ( this.bondFilter.companyId != '' && this.bondFilter.companyId != null)
    {
      cid = Number(this.bondFilter.companyId);
    } 
    
    let status = 0;
    if(this.bondFilter.status != '' && this.bondFilter.status != null)
    {
      status = Number(this.bondFilter.status);
    }

    this.BondRequestApi.Get(cid, status).subscribe({
      next: list => {
        this.BondRequests = list;
        this.applyBondFilter();
      },
      error: err => {
        console.error(err);
        this.toast.errorWithRetry(
          'Failed to load bond requests. Please check your connection.',
          () => this.loadBondRequests()
        );
      }
    });
  }

  applyBondFilter() {
    this.filteredBondRequests = this.BondRequests.filter(t => {
      const matchesStatus =
        !this.bondFilter.status || t.status === Number(this.bondFilter.status);
      return matchesStatus;
    });
  }

  clearbondFilter() {
    this.bondFilter.status = '';
    this.applyBondFilter();
  }

  approveBondRequest(tr: BondRequest) {
    this.BondRequestApi.approve(tr.id).subscribe({
      next: updated => {
        tr.status = updated.status;
        this.applyBondFilter();
        this.toast.success('Bond request approved successfully.');
      },
      error: err => {
        console.error(err);
        this.toast.error('Could not approve bond request. Please try again.');
      }
    });
  }
}
