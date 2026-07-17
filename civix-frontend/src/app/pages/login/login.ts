import { Component } from '@angular/core';
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

  email: string = '';
  password: string = '';
  selectedRole: string = 'CITIZEN';

  showPassword = false;
  rememberMe = false;
  loading = false;

  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  selectRole(role: string) {
    this.selectedRole = role;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {

    this.errorMessage = '';

    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password.trim();

    // Required Validation
    if (!trimmedEmail || !trimmedPassword) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Password Validation
    if (trimmedPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters.';
      return;
    }

    this.loading = true;

    const body = {
      email: trimmedEmail,
      password: trimmedPassword
    };

    this.authService.login(body).subscribe({

      next: (response) => {

        this.loading = false;

        if (response?.success === false) {
          this.errorMessage = response?.message || 'Invalid email or password.';
          return;
        }

        // Role-based redirection
        if (response?.role === 'CITIZEN') {
          this.router.navigate(['/citizen-dashboard']);
        } else if (response?.role === 'OFFICIAL') {
          this.router.navigate(['/official-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }

      },

      error: (err) => {

        this.loading = false;

        console.error(err);

        // Robustly parse the error response body which can be:
        // 1. JSON object containing a message property: err.error.message
        // 2. Plain text / string error: err.error
        let backendMessage = '';
        if (err?.error) {
          if (typeof err.error === 'object' && err.error.message) {
            backendMessage = err.error.message;
          } else if (typeof err.error === 'string') {
            backendMessage = err.error;
          }
        }

        if (err.status === 0) {
          // No HTTP response reached the browser at all —
          // server down, wrong port, or a CORS misconfiguration.
          this.errorMessage = 'Cannot reach the server. Check your connection and try again.';
        }

        else if (err.status === 401 || err.status === 403) {
          this.errorMessage = backendMessage || 'Invalid email or password.';
        }

        else if (err.status === 400) {
          this.errorMessage = backendMessage || 'Invalid request.';
        }

        else if (err.status === 404) {
          this.errorMessage = backendMessage || 'User not found.';
        }

        else if (err.status === 500) {
          this.errorMessage = backendMessage || 'Server error. Please try again later.';
        }

        else {
          this.errorMessage = backendMessage || 'Something went wrong.';
        }

      }

    });

  }

}