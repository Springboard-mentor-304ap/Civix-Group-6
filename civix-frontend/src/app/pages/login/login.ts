import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  email: string = '';
  password: string = '';
  selectedRole: string = 'CITIZEN';

  showPassword = false;
  rememberMe = false;
  loading = false;

  errorMessage = '';

  showRoleErrorModal = false;
  actualRoleCode = '';
  actualRoleName = '';
  selectedPortalName = '';

  selectRole(role: string) {
    this.selectedRole = role;
    this.cdr.detectChanges();
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
    this.cdr.detectChanges();
  }

  closeRoleErrorModal() {
    this.showRoleErrorModal = false;
    this.cdr.detectChanges();
  }

  switchToCorrectRole() {
    if (this.actualRoleCode) {
      this.selectedRole = this.actualRoleCode;
    }
    this.showRoleErrorModal = false;
    this.cdr.detectChanges();
  }

  onLogin() {

    this.errorMessage = '';
    this.showRoleErrorModal = false;

    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password.trim();

    // Required Validation
    if (!trimmedEmail || !trimmedPassword) {
      this.errorMessage = 'All fields are required.';
      this.cdr.detectChanges();
      return;
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      this.errorMessage = 'Please enter a valid email address.';
      this.cdr.detectChanges();
      return;
    }

    // Password Validation
    if (trimmedPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    const body = {
      email: trimmedEmail,
      password: trimmedPassword
    };

    console.log('[Login] Submitting login request for:', body.email, 'Selected Portal:', this.selectedRole);

    this.authService.login(body).subscribe({

      next: (response) => {

        this.loading = false;
        console.log('[Login] Response from server:', response);

        if (response?.success === false) {
          this.errorMessage = response?.message || 'Invalid email or password.';
          this.cdr.detectChanges();
          return;
        }

        const userRole = (response?.role || '').toUpperCase();
        const portalRole = (this.selectedRole || '').toUpperCase();

        console.log(`[Login] Role Check -> User Role: ${userRole}, Selected Portal: ${portalRole}`);

        // Validate selected portal role against user's actual registered role
        if (userRole && userRole !== portalRole) {
          console.warn('[Login] Mismatch detected! Showing popup modal.');
          this.authService.logout();
          this.actualRoleCode = userRole;
          this.actualRoleName = userRole === 'CITIZEN' ? 'Citizen' : 'Officer';
          this.selectedPortalName = portalRole === 'OFFICIAL' ? 'Officer' : 'Citizen';
          this.showRoleErrorModal = true;
          this.errorMessage = '';
          this.cdr.detectChanges();
          return;
        }

        // Role-based redirection
        if (userRole === 'CITIZEN') {
          this.router.navigate(['/citizen-dashboard']);
        } else if (userRole === 'OFFICIAL') {
          this.router.navigate(['/official-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        this.cdr.detectChanges();
      },

      error: (err) => {

        this.loading = false;
        console.error('[Login] Server Error:', err);

        let backendMessage = '';
        if (err?.error) {
          if (typeof err.error === 'object' && err.error.message) {
            backendMessage = err.error.message;
          } else if (typeof err.error === 'string') {
            backendMessage = err.error;
          }
        }

        if (err.status === 0) {
          this.errorMessage = 'Cannot reach the server. Check your connection and try again.';
        } else if (err.status === 401 || err.status === 403) {
          this.errorMessage = backendMessage || 'Invalid email or password.';
        } else if (err.status === 400) {
          this.errorMessage = backendMessage || 'Invalid request.';
        } else if (err.status === 404) {
          this.errorMessage = backendMessage || 'User not found.';
        } else if (err.status === 500) {
          this.errorMessage = backendMessage || 'Server error. Please try again later.';
        } else {
          this.errorMessage = backendMessage || 'Something went wrong.';
        }

        this.cdr.detectChanges();
      }

    });

  }

}