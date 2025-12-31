import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CompanyStateService } from '../../services/company-state.service';
import { BondRequestApiService } from '../../services/bond-request-api.service';
import { Company, BondRequest } from '../../models/company.model';
import { BondRequestDto } from '../../models/dtos.model';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './company-dashboard.component.html',
  styleUrls: ['./company-dashboard.component.scss']
})
export class CompanyDashboardComponent implements OnInit {
  company: Company | null = null;
  BondRequests: BondRequest[] = [];

  newRequest: BondRequestDto = {
    companyId: 0,
    status: 0,
    totalCount: 0,
    price: 0,
    term: 0,
    interestRate: 0,
    realizationPeriodNumber: 0
  };

  loading = false;
  error = '';
  info = '';

  constructor(
    private companyState: CompanyStateService,
    private BondRequestApi: BondRequestApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.company = this.companyState.company;

    if (!this.company || !this.companyState.companyUser) {
      this.router.navigate(['/company/login']);
      return;
    }

    this.newRequest.companyId = this.company.id;
    this.loadBondRequests();
  }

  isActive(): boolean {
    return !!this.company && this.company.status === 1;
  }

  loadBondRequests() {
    if (!this.company) return;

    this.BondRequestApi.Get(this.company.id).subscribe({
      next: list => {
        this.BondRequests = list; 
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to load bond requests.';
      }
    });
  }

  onCreateRequest() {
    if (!this.company) return;
    if (!this.isActive()) {
      this.error = 'Company is not active. Cannot create bond request.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.info = '';

    this.newRequest.companyId = this.company.id;
    this.newRequest.status = 0;

    this.BondRequestApi.create(this.newRequest).subscribe({
      next: tr => {
        this.loading = false;
        this.info = 'bond request created.';
        this.BondRequests.push(tr);
        this.newRequest = {
          companyId: this.company!.id,
          status: 0,
          totalCount: 0,
          price: 0,
          term: 0,
          interestRate: 0,
          realizationPeriodNumber: 0
        };
      },
      error: err => {
        this.loading = false;
        console.error(err);
        this.error = 'Failed to create bond request.';
      }
    });
  }
}
