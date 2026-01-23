import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CompanyStateService } from '../../../core/state/company-state.service';
import { RequestApiService } from '../../../core/api/request-api.service';
import { ProductApiService } from '../../../core/api/product-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogService } from '../../../core/services/dialog.service';

import { Company } from '../../../shared/models/company.model';
import { Request, RequestStatus } from '../../../shared/models/request.model';
import { Product, ScheduleType } from '../../../shared/models/product.model';
import { RequestDto } from '../../../shared/models/dtos.model';

type CompanyTab = 'requests' | 'products';
type ModalMode =
  | 'none'
  | 'requestView'
  | 'requestAdd'
  | 'productView'
  | 'productAdd'
  | 'productEdit'
  | 'productEditFromRequest';

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
  selectedRequest: Request | null = null;

  // Products tab state
  products: Product[] = [];
  productsLoading = false;
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
  requestForm: RequestDto = { companyId: 0, prodId: 0 };
  requestFormProdIdManual: number | null = null;

  productForm: Product = {
    id: 0,
    companyId: 0,
    name: '',
    totalQuantity: 0,
    price: 0,
    term: null,
    scheduleType: ScheduleType.None
  };

  private toast = inject(ToastService);
  private dialog = inject(DialogService);

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
    this.selectedRequest = null;

    this.requestApi.getAll(this.company.id, RequestStatus.None).subscribe({
      next: data => {
        this.requests = data ?? [];
        this.requestsLoading = false;
      },
      error: err => {
        console.error(err);
        this.requestsLoading = false;
        this.toast.error('Failed to load requests.');
      }
    });
  }

  selectRequest(r: Request) {
    this.selectedRequest = r;
  }

  onRequestView() {
    if (!this.selectedRequest) return;

    this.openModal('requestView', 'Request details');
    this.modalLoading = true;

    this.requestApi.getById(this.selectedRequest.id).subscribe({
      next: req => {
        this.modalRequest = req;
        this.modalLoading = false;
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.closeModal();
        this.toast.error('Failed to load request details.');
      }
    });
  }

  onRequestAdd() {
    if (!this.company) return;

    this.requestForm = { companyId: this.company.id, prodId: 0 };
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

    const dto: RequestDto = { companyId: this.company.id, prodId };

    this.modalLoading = true;
    this.modalError = '';

    this.requestApi.create(dto).subscribe({
      next: _ => {
        this.modalLoading = false;
        this.closeModal();
        this.loadRequests();
        this.toast.success('Request created successfully.');
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.toast.error('Failed to create request.');
      }
    });
  }

  onRequestEdit() {
    // Per provided backend signatures, Request "Edit" uses Product.Update with the request's ProdId
    if (!this.selectedRequest) return;
    this.openProductEdit(this.selectedRequest.prodId, 'productEditFromRequest');
  }

  async onRequestDelete() {
    // Per provided backend signatures, Request "Delete" uses Product.Delete with the request's ProdId
    if (!this.selectedRequest) return;

    const prodId = this.selectedRequest.prodId;
    const confirmed = await this.dialog.confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete product #${prodId} from this request?`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) return;

    this.productsLoading = true;

    this.productApi.delete(prodId).subscribe({
      next: _ => {
        this.productsLoading = false;
        this.selectedRequest = null;
        this.reloadProducts();
        this.loadRequests();
        this.toast.success('Product deleted successfully.');
      },
      error: err => {
        console.error(err);
        this.productsLoading = false;
        this.toast.error('Failed to delete product.');
      }
    });
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
        this.toast.error('Failed to load products.');
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
        this.closeModal();
        this.toast.error('Failed to load product details.');
      }
    });
  }

  onProductAdd() {
    if (!this.company) return;

    this.productForm = {
      id: 0,
      companyId: this.company.id,
      name: '',
      totalQuantity: 0,
      price: 0,
      term: null,
      scheduleType: ScheduleType.None
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
        this.toast.success('Product created successfully.');
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.toast.error('Failed to create product.');
      }
    });
  }

  onProductEdit() {
    if (!this.selectedProduct) return;
    this.openProductEdit(this.selectedProduct.id, 'productEdit');
  }

  private openProductEdit(prodId: number, mode: 'productEdit' | 'productEditFromRequest') {
    this.openModal(mode, 'Edit product');
    this.modalLoading = true;

    this.productApi.getById(prodId).subscribe({
      next: prod => {
        // Normalize term (null when missing)
        const term = prod.term === undefined ? null : prod.term;
        this.productForm = { ...prod, term: term as any };
        this.modalLoading = false;
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.closeModal();
        this.toast.error('Failed to load product.');
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
        this.toast.success('Product updated successfully.');
      },
      error: err => {
        console.error(err);
        this.modalLoading = false;
        this.toast.error('Failed to update product.');
      }
    });
  }

  async onProductDelete() {
    if (!this.selectedProduct) return;

    const prodId = this.selectedProduct.id;
    const confirmed = await this.dialog.confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete product #${prodId}?`,
      confirmText: 'Delete',
      type: 'danger'
    });
    if (!confirmed) return;

    this.productsLoading = true;

    this.productApi.delete(prodId).subscribe({
      next: _ => {
        this.productsLoading = false;
        this.selectedProduct = null;
        this.reloadProducts();
        this.loadRequests();
        this.toast.success('Product deleted successfully.');
      },
      error: err => {
        console.error(err);
        this.productsLoading = false;
        this.toast.error('Failed to delete product.');
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
      case RequestStatus.Registered:
        return 'Registered';
      case RequestStatus.Authorized:
        return 'Authorized';
      case RequestStatus.Approved:
        return 'Approved';
      case RequestStatus.Rejected:
        return 'Rejected';
      default:
        return `Status ${status}`;
    }
  }

  scheduleTypeLabel(value: number): string {
    switch (value) {
      case ScheduleType.None:
        return 'None';
      case ScheduleType.Monthly:
        return 'Monthly';
      case ScheduleType.Quarterly:
        return 'Quarterly';
      case ScheduleType.SemiAnnual:
        return 'Semi-Annual';
      case ScheduleType.Annual:
        return 'Annual';
      default:
        return `Type ${value}`;
    }
  }
}
