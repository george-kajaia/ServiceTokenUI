import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InvestorApiService } from '../../../core/api/investor-api.service';
import { InvestorStateService } from '../../../core/state/investor-state.service';
import { InvestorCreateDto } from '../../../shared/models/dtos.model';

@Component({
  selector: 'app-investor-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './investor-login.component.html',
  styleUrls: ['./investor-login.component.scss']
})
export class InvestorLoginComponent {
  isRegisterMode = false;

  loginModel = {
    userName: '',
    password: ''
  };

  registerModel: InvestorCreateDto = {
    publicKey: '',
    userName: '',
    password: ''
  };

  loading = false;
  error = '';
  info = '';

  constructor(
    private investorApi: InvestorApiService,
    private investorState: InvestorStateService,
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

    this.investorApi.login(this.loginModel).subscribe({
      next: investor => {
        this.loading = false;
        this.investorState.investor = investor;
        this.router.navigate(['/investor/marketplace']);
      },
      error: err => {
        this.loading = false;
        console.error(err);
        this.error = 'Login failed.';
      }
    });
  }

  onRegister() {
    this.loading = true;
    this.error = '';
    this.info = '';

    this.investorApi.register(this.registerModel).subscribe({
      next: _ => {
        this.loading = false;
        this.info = 'Registration successful. Please login.';
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
