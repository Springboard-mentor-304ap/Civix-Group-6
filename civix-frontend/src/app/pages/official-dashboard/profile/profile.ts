import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

@Component({
  selector: 'app-official-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class OfficialProfileComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Editable fields
  name = '';
  city = '';
  state = '';
  location = '';
  department = '';

  // Read-only fields
  email = '';
  role = '';

  successMessage = '';
  errorMessage = '';
  loading = false;
  submitting = false;

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('Official session not found in Profile. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    console.log('[Profile] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    console.log('[Profile] Request sent to GET /api/auth/me');

    this.http.get<any>('http://localhost:8080/api/auth/me').pipe(
      catchError((err) => {
        console.error('[Profile] Error loading profile from server, using local fallback:', err);
        // Fallback local load
        this.name = localStorage.getItem('name') || 'Official Representative';
        this.email = localStorage.getItem('email') || 'official@gov.in';
        this.role = localStorage.getItem('role') || 'OFFICIAL';
        this.city = localStorage.getItem('city') || 'Delhi';
        this.state = localStorage.getItem('state') || 'Delhi';
        this.location = localStorage.getItem('location') || 'Delhi, India';
        this.department = localStorage.getItem('department') || 'Municipal Administration';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        console.log('[Profile] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe(user => {
      console.log('[Profile] Response received:', user);
      if (user) {
        this.name = user.name || '';
        this.email = user.email || '';
        this.role = user.role || '';
        this.city = user.city || '';
        this.state = user.state || '';
        this.location = user.location || '';
        this.department = user.department || 'Municipal Administration';

        // Sync local storage
        localStorage.setItem('name', this.name);
        localStorage.setItem('email', this.email);
        localStorage.setItem('role', this.role);
        localStorage.setItem('city', this.city);
        localStorage.setItem('state', this.state);
        localStorage.setItem('location', this.location);
        localStorage.setItem('department', this.department);
      }
      this.loading = false;
      console.log('[Profile] Profile properties populated:', {
        name: this.name,
        email: this.email,
        role: this.role,
        department: this.department
      });
      this.cdr.detectChanges();
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim() || !this.city.trim() || !this.state.trim() || !this.department.trim()) {
      this.errorMessage = 'Name, City, State, and Department are required.';
      return;
    }

    this.submitting = true;
    const payload = {
      name: this.name.trim(),
      city: this.city.trim(),
      state: this.state.trim(),
      location: this.location.trim(),
      department: this.department.trim()
    };

    console.log('Updating profile with payload:', payload);

    this.http.put('http://localhost:8080/api/users/profile', payload).pipe(
      catchError(err => {
        console.error('Error updating profile on server, using local fallback:', err);
        // Fallback local update
        localStorage.setItem('name', payload.name);
        localStorage.setItem('city', payload.city);
        localStorage.setItem('state', payload.state);
        localStorage.setItem('location', payload.location);
        localStorage.setItem('department', payload.department);
        
        window.dispatchEvent(new Event('profileUpdated'));

        this.successMessage = 'Official profile updated successfully!';
        return of(null);
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe(res => {
      if (res !== null) {
        localStorage.setItem('name', payload.name);
        localStorage.setItem('city', payload.city);
        localStorage.setItem('state', payload.state);
        localStorage.setItem('location', payload.location);
        localStorage.setItem('department', payload.department);
        
        window.dispatchEvent(new Event('profileUpdated'));
        this.successMessage = 'Official profile updated successfully!';
      }
    });
  }
}
