import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CompanyLoginComponent } from './components/company/company-login.component';
import { CompanyDashboardComponent } from './components/company/company-dashboard.component';
import { InvestorLoginComponent } from './components/investor/investor-login.component';
import { InvestorMarketplaceComponent } from './components/investor/investor-marketplace.component';
import { AdminLoginComponent } from './components/admin/admin-login.component';
import { AdminDashboardComponent } from './components/admin/admin-dashboard.component';

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
