import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CompanyApiService } from '../../../core/api/company-api.service';
import { CompanyStateService } from '../../../core/state/company-state.service';

@Component({
  selector: 'app-company-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './company-login.component.html',
  styleUrls: ['./company-login.component.scss']
})
export class CompanyLoginComponent {
  isRegisterMode = false;

  loginModel = {
    userName: '',
    password: ''
  };

  registerModel = {
    name: '',
    taxCode: '',
    userName: '',
    password: ''
  };

  loading = false;
  error = '';
  info = '';

  constructor(
    private companyApi: CompanyApiService,
    private companyState: CompanyStateService,
    private router: Router
  ) {}

  toggleMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.error = '';
    this.info = '';
  }

  onLogin() {
    this.loading = true;
    this.error = '';
    this.info = '';

    this.companyApi.login(this.loginModel).subscribe({
      next: companyUser => {
        this.companyState.companyUser = companyUser;
        this.companyApi.getById(companyUser.companyId).subscribe({
          next: company => {
            this.loading = false;
            this.companyState.company = company;
            this.router.navigate(['/company/dashboard']);
          },
          error: err => {
            this.loading = false;
            console.error(err);
            this.error = 'Login succeeded, but failed to load company data.';
          }
        });
      },
      error: err => {
        this.loading = false;
        console.error(err);
        this.error = 'Login failed. Please check your credentials.';
      }
    });
  }

  onRegister() {
    this.loading = true;
    this.error = '';
    this.info = '';
    this.companyApi.register(this.registerModel).subscribe({
      next: _ => {
        this.loading = false;
        this.info = 'Registration successful. Please login with your credentials.';
        this.isRegisterMode = false;
      },
      error: err => {
        this.loading = false;
        console.error(err);
        this.error = 'Registration failed.';
      }
    });
  }
}
