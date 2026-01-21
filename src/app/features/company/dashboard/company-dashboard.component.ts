import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CompanyStateService } from '../../../core/state/company-state.service';
import { RequestApiService } from '../../../core/api/request-api.service';
import { ProductApiService } from '../../../core/api/product-api.service';

import { Company } from '../../../shared/models/company.model';
import { Request, RequestStatus } from '../../../shared/models/request.model';
import { Product, SchedulePeriodType } from '../../../shared/models/product.model';
import { RequestDto } from '../../../shared/models/dtos.model';

type CompanyTab = 'requests' | 'products';
type ModalMode =
  | 'none'
  | 'requestView'
  | 'requestAdd'
  | 'requestEdit'
  | 'productView'
  | 'productAdd'
  | 'productEdit';

@Component({
  selector: 'app-company-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './company-dashboard.component.html',
  styleUrls: ['./company-dashboard.component.scss']
})
export class CompanyDashboardComponent implements OnInit {
  company: Company | null = null;

  activeTab: CompanyTab = 'requests';

  // Requests tab state
  requests: Request[] = [];
  requestsLoading = false;
  requestsError = '';
  selectedRequest: Request | null = null;

  // Products tab state
  products: Product[] = [];
  productsLoading = false;
  productsError = '';
  selectedProduct: Product | null = null;

  // Products query state (API does not expose CompanyId filter; we filter client-side)
  productSearch = '';
  productSkip = 0;
  productTake = 200;

  // Modal state
  modalOpen = false;
  modalMode: ModalMode = 'none';
  modalTitle = '';
  modalLoading = false;
  modalError = '';

  modalRequest: Request | null = null;
  modalProduct: Product | null = null;

  // Forms
  requestForm: RequestDto = { companyId: 0, prodId: 0, serviceTokenCount: 1 };
  requestFormProdIdManual: number | null = null;

  productForm: Product = {
    id: 0,
    companyId: 0,
    name: '',
    serviceCount: 0,
    price: 0,
    term: null,
    scheduleType: { periodType: SchedulePeriodType.None, periodNumber: null }
  };

  constructor(
    private router: Router,
    private companyState: CompanyStateService,
    private requestApi: RequestApiService,
    private productApi: ProductApiService
  ) {}

  ngOnInit(): void {
    this.company = this.companyState.company;

    if (!this.company) {
      this.router.navigate(['/company/login']);
      return;
    }

    this.loadRequests();
    this.reloadProducts();
  }

  setTab(tab: CompanyTab) {
    this.activeTab = tab;
  }

  // -----------------------------
  // Requests
  // -----------------------------
  loadRequests() {
    if (!this.company) return;

    this.requestsLoading = true;
    this.requestsError = '';
    this.selectedRequest = null;

    this.requestApi.getAll(this.company.id, RequestStatus.None).subscribe({
      next: data => {
        this.requests = data ?? [];
        this.requestsLoading = false;
      },
      error: err => {
        console.error(err);
        this.requestsLoading = false;
        this.requestsError = 'Failed to load requests.';
      }
    });
  }

  selectRequest(r: Request) {
    this.selectedRequest = r;
  }

  onRequestView() {
    if (!this.selectedRequest) return;

    this.openModal('requestView', 'Request details');
    // We already have the request object from the grid; show it directly.
    // (Backend GetById route token naming is inconsistent in the provided API.)
    this.modalRequest = { ...this.selectedRequest };
  }

  onRequestAdd() {
    if (!this.company) return;

    this.requestForm = { companyId: this.company.id, prodId: 0, serviceTokenCount: 1 };
    this.requestFormProdIdManual = null;
    this.openModal('requestAdd', 'Add new request');
  }

  submitRequestAdd() {
    if (!this.company) return;

    const prodId =
      (this.requestFormProdIdManual ?? 0) > 0 ? (this.requestFormProdIdManual as number) : this.requestForm.prodId;

    if (!prodId || prodId <= 0) {
      this.modalError = 'Please select or enter a valid Product Id.';
      return;
    }

    const dto: RequestDto = { companyId: this.company.id, prodId, serviceTokenCount: this.requestForm.serviceTokenCount };

    this.modalLoading = true;
    this.modalError = '';

    this.requestApi.create(dto).subscribe({
      next: _ => {
        this.modalLoading = false;
        this.closeModal();
        this.loadRequests();
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.modalError = 'Failed to create request.';
      }
    });
  }

  onRequestEdit() {
    if (!this.company || !this.selectedRequest) return;

    this.requestForm = {
      companyId: this.company.id,
      prodId: this.selectedRequest.prodId,
      serviceTokenCount: this.selectedRequest.serviceTokenCount
    };
    this.requestFormProdIdManual = null;
    this.openModal('requestEdit', 'Edit request');
  }

  submitRequestEdit() {
    if (!this.company || !this.selectedRequest) return;

    const prodId = this.requestForm.prodId;
    if (!prodId || prodId <= 0) {
      this.modalError = 'Please select a valid Product Id.';
      return;
    }

    if (!this.requestForm.serviceTokenCount || this.requestForm.serviceTokenCount <= 0) {
      this.modalError = 'Please enter a valid Service Token Count.';
      return;
    }

    const dto: RequestDto = {
      companyId: this.company.id,
      prodId,
      serviceTokenCount: this.requestForm.serviceTokenCount
    };

    this.modalLoading = true;
    this.modalError = '';

    this.requestApi.update(this.selectedRequest.id, this.selectedRequest.rowVersion, dto).subscribe({
      next: _ => {
        this.modalLoading = false;
        this.closeModal();
        this.loadRequests();
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.modalError = 'Failed to update request.';
      }
    });
  }

  onRequestDelete() {
    if (!this.selectedRequest) return;
    if (!confirm(`Delete request #${this.selectedRequest.id}?`)) return;

    this.requestsLoading = true;
    this.requestsError = '';

    this.requestApi.delete(this.selectedRequest.id, this.selectedRequest.rowVersion).subscribe({
      next: _ => {
        this.requestsLoading = false;
        this.selectedRequest = null;
        this.loadRequests();
      },
      error: err => {
        console.error(err);
        this.requestsLoading = false;
        this.requestsError = 'Failed to delete request.';
      }
    });
  }


  // Row-level workflow actions (per request record)
  authorizeRequestRow(r: Request, event?: Event) {
    event?.stopPropagation();
    if (Number(r.status) !== RequestStatus.Created) return;

    this.requestsLoading = true;
    this.requestsError = '';

    this.requestApi.authorize(r.id, r.rowVersion).subscribe({
      next: updated => {
        this.requestsLoading = false;
        this.patchRequestInList(updated);
      },
      error: err => {
        console.error(err);
        this.requestsLoading = false;
        this.requestsError = 'Failed to authorize request.';
      }
    });
  }

  deauthorizeRequestRow(r: Request, event?: Event) {
    event?.stopPropagation();
    if (Number(r.status) !== RequestStatus.Authorised) return;

    this.requestsLoading = true;
    this.requestsError = '';

    this.requestApi.deauthorize(r.id, r.rowVersion).subscribe({
      next: updated => {
        this.requestsLoading = false;
        this.patchRequestInList(updated);
      },
      error: err => {
        console.error(err);
        this.requestsLoading = false;
        this.requestsError = 'Failed to deauthorize request.';
      }
    });
  }

  deleteRequestRow(r: Request, event?: Event) {
    event?.stopPropagation();
    if (!confirm(`Delete request #${r.id}?`)) return;

    this.requestsLoading = true;
    this.requestsError = '';

    this.requestApi.delete(r.id, r.rowVersion).subscribe({
      next: _ => {
        this.requestsLoading = false;
        // Remove from local list
        this.requests = this.requests.filter(x => x.id !== r.id);
        if (this.selectedRequest?.id === r.id) this.selectedRequest = null;
      },
      error: err => {
        console.error(err);
        this.requestsLoading = false;
        this.requestsError = 'Failed to delete request.';
      }
    });
  }

  private patchRequestInList(updated: Request) {
    const idx = this.requests.findIndex(x => x.id === updated.id);
    if (idx >= 0) {
      this.requests[idx] = updated;
    } else {
      this.requests = [updated, ...this.requests];
    }

    if (this.selectedRequest?.id === updated.id) {
      this.selectedRequest = updated;
    }
  }

  // -----------------------------
  // Products
  // -----------------------------
  reloadProducts() {
    if (!this.company) return;

    this.productSkip = 0;
    this.products = [];
    this.selectedProduct = null;
    this.loadProductsPage(true);
  }

  loadProductsPage(resetSelection: boolean = false) {
    if (!this.company) return;

    if (resetSelection) this.selectedProduct = null;
    this.productsLoading = true;
    this.productsError = '';

    this.productApi.getAll(this.productSkip, this.productTake, this.productSearch || null).subscribe({
      next: data => {
        const all = data ?? [];
        const mine = all.filter(p => p.companyId === this.company!.id);

        // Append while avoiding duplicates by id (in case of server-side ordering changes)
        const existing = new Map(this.products.map(p => [p.id, p]));
        for (const p of mine) existing.set(p.id, p);

        this.products = Array.from(existing.values()).sort((a, b) => a.id - b.id);
        this.productsLoading = false;

        // Move to next page only when user requests "Load more"
        // (we keep productSkip for loadMore() handler)
      },
      error: err => {
        console.error(err);
        this.productsLoading = false;
        this.productsError = 'Failed to load products.';
      }
    });
  }

  loadMoreProducts() {
    this.productSkip += this.productTake;
    this.loadProductsPage(false);
  }

  selectProduct(p: Product) {
    this.selectedProduct = p;
  }

  onProductView() {
    if (!this.selectedProduct) return;

    this.openModal('productView', 'Product details');
    this.modalLoading = true;

    this.productApi.getById(this.selectedProduct.id).subscribe({
      next: prod => {
        this.modalProduct = prod;
        this.modalLoading = false;
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.modalError = 'Failed to load product details.';
      }
    });
  }

  onProductAdd() {
    if (!this.company) return;

    this.productForm = {
      id: 0,
      companyId: this.company.id,
      name: '',
      serviceCount: 0,
      price: 0,
      term: null,
      scheduleType: { periodType: SchedulePeriodType.None, periodNumber: null }
    };

    this.openModal('productAdd', 'Add new product');
  }

  submitProductAdd() {
    if (!this.company) return;

    this.modalLoading = true;
    this.modalError = '';

    const payload: Product = {
      ...this.productForm,
      companyId: this.company.id
    };

    this.productApi.create(payload).subscribe({
      next: _ => {
        this.modalLoading = false;
        this.closeModal();
        this.reloadProducts();
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.modalError = 'Failed to create product.';
      }
    });
  }

  onProductEdit() {
    if (!this.selectedProduct) return;
    this.openProductEdit(this.selectedProduct.id);
  }

  private openProductEdit(prodId: number) {
    this.openModal('productEdit', 'Edit product');
    this.modalLoading = true;

    this.productApi.getById(prodId).subscribe({
      next: prod => {
        const term = prod.term === undefined ? null : prod.term;
        const scheduleType = prod.scheduleType ?? { periodType: SchedulePeriodType.None, periodNumber: null };
        this.productForm = { ...prod, term: term as any, scheduleType };
        this.modalLoading = false;
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.modalError = 'Failed to load product.';
      }
    });
  }

  submitProductEdit() {
    if (!this.company) return;

    this.modalLoading = true;
    this.modalError = '';

    const prodId = this.productForm.id;

    // Ensure companyId is preserved
    const payload: Product = { ...this.productForm, companyId: this.company.id };

    this.productApi.update(prodId, payload).subscribe({
      next: _ => {
        this.modalLoading = false;
        this.closeModal();
        this.reloadProducts();
        // If edit was invoked from Requests tab, refresh Requests as well (prodId referenced there)
        this.loadRequests();
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.modalError = 'Failed to update product.';
      }
    });
  }

  onProductDelete() {
    if (!this.selectedProduct) return;

    const prodId = this.selectedProduct.id;
    if (!confirm(`Delete product #${prodId}?`)) return;

    this.productsLoading = true;
    this.productsError = '';

    this.productApi.delete(prodId).subscribe({
      next: _ => {
        this.productsLoading = false;
        this.selectedProduct = null;
        this.reloadProducts();
        this.loadRequests();
      },
      error: err => {
        console.error(err);
        this.productsLoading = false;
        this.productsError = 'Failed to delete product.';
      }
    });
  }

  // -----------------------------
  // Modal helpers
  // -----------------------------
  openModal(mode: ModalMode, title: string) {
    this.modalOpen = true;
    this.modalMode = mode;
    this.modalTitle = title;

    this.modalLoading = false;
    this.modalError = '';

    this.modalRequest = null;
    this.modalProduct = null;
  }

  closeModal() {
    this.modalOpen = false;
    this.modalMode = 'none';
    this.modalTitle = '';
    this.modalLoading = false;
    this.modalError = '';
    this.modalRequest = null;
    this.modalProduct = null;
  }

  // -----------------------------
  // Display helpers
  // -----------------------------
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

  scheduleTypeLabel(periodType: number, periodNumber?: number | null): string {
    const label = this.schedulePeriodLabel(periodType);
    if (!periodNumber || periodNumber <= 0) return label;
    return `${label} / ${periodNumber}`;
  }

  schedulePeriodLabel(value: number): string {
    switch (value) {
      case SchedulePeriodType.None:
        return 'None';
      case SchedulePeriodType.Daily:
        return 'Daily';
      case SchedulePeriodType.Weekly:
        return 'Weekly';
      case SchedulePeriodType.Monthly:
        return 'Monthly';
      case SchedulePeriodType.Yearly:
        return 'Yearly';
      default:
        return `Period ${value}`;
    }
  }
}
