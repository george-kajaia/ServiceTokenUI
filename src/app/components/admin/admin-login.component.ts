import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../services/admin-api.service';
import { AdminStateService } from '../../services/admin-state.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.scss']
})
export class AdminLoginComponent {
  model = {
    userName: '',
    password: ''
  };

  loading = false;
  error = '';

  constructor(
    private adminApi: AdminApiService,
    private adminState: AdminStateService,
    private router: Router
  ) {}

  onLogin() {
    this.loading = true;
    this.error = '';

    this.adminApi.login(this.model).subscribe({
      next: user => {
        this.loading = false;
        this.adminState.admin = user;
        this.router.navigate(['/admin/dashboard']);
      },
      error: err => {
        this.loading = false;
        console.error(err);
        this.error = 'Admin login failed.';
      }
    });
  }
}
