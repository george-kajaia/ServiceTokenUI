import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminStateService } from '../../../core/state/admin-state.service';
import { CompanyApiService } from '../../../core/api/company-api.service';
import { RequestApiService } from '../../../core/api/request-api.service';

import { Company } from '../../../shared/models/company.model';
import { Request, RequestStatus } from '../../../shared/models/request.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'companies' | 'requests' = 'companies';

  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  companyFilter = {
    name: '',
    taxCode: '',
    status: '' as '' | '0' | '1'
  };

  requests: Request[] = [];
  filteredRequests: Request[] = [];
  requestFilter = {
    companyId: '',
    status: '' as '' | '0' | '1' | '2' | '3'
  };

  loading = false;
  error = '';

  constructor(
    private adminState: AdminStateService,
    private router: Router,
    private companyApi: CompanyApiService,
    private requestApi: RequestApiService
  ) {}

  ngOnInit(): void {
    if (!this.adminState.admin) {
      this.router.navigate(['/admin/login']);
      return;
    }

    this.loadCompanies();
  }

  setTab(tab: 'companies' | 'requests') {
    this.activeTab = tab;
    this.error = '';

    if (tab === 'companies') {
      this.loadCompanies();
    } else {
      this.loadRequests();
    }
  }

  // -----------------------------
  // Companies
  // -----------------------------
  loadCompanies() {
    this.loading = true;
    this.error = '';

    this.companyApi.getAll(0, 500, null).subscribe({
      next: list => {
        this.companies = list ?? [];
        this.loading = false;
        this.applyCompanyFilter();
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.error = 'Failed to load companies.';
      }
    });
  }

  applyCompanyFilter() {
    this.filteredCompanies = this.companies.filter(c => {
      const matchesName = !this.companyFilter.name || c.name.toLowerCase().includes(this.companyFilter.name.toLowerCase());
      const matchesTax = !this.companyFilter.taxCode || c.taxCode.toLowerCase().includes(this.companyFilter.taxCode.toLowerCase());
      const matchesStatus = !this.companyFilter.status || c.status === Number(this.companyFilter.status);
      return matchesName && matchesTax && matchesStatus;
    });
  }

  clearCompanyFilter() {
    this.companyFilter = { name: '', taxCode: '', status: '' };
    this.applyCompanyFilter();
  }

  approveCompany(company: Company) {
    this.error = '';
    this.companyApi.approveCompany(company.id, company.rowVersion).subscribe({
      next: _ => {
        // Backend returns 200 OK with no body; refresh to get new rowVersion and status.
        this.loadCompanies();
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to approve company.';
      }
    });
  }

  // -----------------------------
  // Requests
  // -----------------------------
  loadRequests() {
    this.loading = true;
    this.error = '';

    let cid = -1;
    if (this.requestFilter.companyId) {
      const parsed = Number(this.requestFilter.companyId);
      if (!Number.isNaN(parsed)) cid = parsed;
    }

    let status = 0;
    if (this.requestFilter.status) {
      const parsed = Number(this.requestFilter.status);
      if (!Number.isNaN(parsed)) status = parsed;
    }

    this.requestApi.getAll(cid, status).subscribe({
      next: list => {
        this.requests = list ?? [];
        this.loading = false;
        this.applyRequestFilter();
      },
      error: err => {
        console.error(err);
        this.loading = false;
        this.error = 'Failed to load requests.';
      }
    });
  }

  applyRequestFilter() {
    this.filteredRequests = this.requests.filter(r => {
      const matchesStatus = !this.requestFilter.status || Number(r.status) === Number(this.requestFilter.status);
      return matchesStatus;
    });
  }

  clearRequestFilter() {
    this.requestFilter.status = '';
    this.applyRequestFilter();
  }

  authorizeRequest(r: Request) {
    this.error = '';
    this.requestApi.authorize(r.id, r.rowVersion).subscribe({
      next: _ => this.loadRequests(),
      error: err => {
        console.error(err);
        this.error = 'Failed to authorize request.';
      }
    });
  }

  deauthorizeRequest(r: Request) {
    this.error = '';
    this.requestApi.deauthorize(r.id, r.rowVersion).subscribe({
      next: _ => this.loadRequests(),
      error: err => {
        console.error(err);
        this.error = 'Failed to deauthorize request.';
      }
    });
  }

  approveRequest(r: Request) {
    this.error = '';
    this.requestApi.approve(r.id, r.rowVersion).subscribe({
      next: _ => this.loadRequests(),
      error: err => {
        console.error(err);
        this.error = 'Failed to approve request.';
      }
    });
  }

  deleteRequest(r: Request) {
    if (!confirm(`Delete request #${r.id}?`)) return;

    this.error = '';
    this.requestApi.delete(r.id, r.rowVersion).subscribe({
      next: _ => this.loadRequests(),
      error: err => {
        console.error(err);
        this.error = 'Failed to delete request.';
      }
    });
  }

  requestStatusLabel(status: number): string {
    switch (status) {
      case RequestStatus.None:
        return 'None';
      case RequestStatus.Created:
        return 'Created';
      case RequestStatus.Authorised:
        return 'Authorised';
      case RequestStatus.Approved:
        return 'Approved';
      default:
        return `Status ${status}`;
    }
  }
}
