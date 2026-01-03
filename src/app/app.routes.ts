import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { CompanyLoginComponent } from './features/auth/company-login/company-login.component';
import { CompanyDashboardComponent } from './features/company/dashboard/company-dashboard.component';
import { InvestorLoginComponent } from './features/auth/investor-login/investor-login.component';
import { InvestorMarketplaceComponent } from './features/investor/marketplace/investor-marketplace.component';
import { AdminLoginComponent } from './features/auth/admin-login/admin-login.component';
import { AdminDashboardComponent } from './features/admin/dashboard/admin-dashboard.component';

export const appRoutes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },

  { path: 'company/login', component: CompanyLoginComponent },
  { path: 'company/dashboard', component: CompanyDashboardComponent },

  { path: 'investor/login', component: InvestorLoginComponent },
  { path: 'investor/marketplace', component: InvestorMarketplaceComponent },

  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/dashboard', component: AdminDashboardComponent },

  { path: '**', redirectTo: '' }
];
