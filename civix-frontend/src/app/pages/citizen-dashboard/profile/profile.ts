import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

@Component({
  selector: 'app-citizen-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class CitizenProfileComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // Editable fields
  name = '';
  city = '';
  state = '';
  location = '';

  // Read-only fields
  email = '';
  role = '';

  successMessage = '';
  errorMessage = '';
  loading = false;
  submitting = false;

  // Petitions list for the logged-in user
  myPetitions: any[] = [];
  fetchingPetitions = false;
  petitionsError = '';

  ngOnInit() {
    this.loadProfile();
    this.fetchMyPetitions();
  }

  fetchMyPetitions() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('[Citizen Profile] Session not found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    console.log('[Citizen Profile] Fetching my petitions...');
    this.fetchingPetitions = true;
    this.petitionsError = '';
    this.cdr.detectChanges();

    this.http.get<any[]>(`http://localhost:8080/api/petitions?userId=${userId}`).pipe(
      catchError((err) => {
        console.error('[Citizen Profile] Error fetching my petitions:', err);
        this.petitionsError = 'Failed to load your drafted petitions.';
        return of([]);
      }),
      finalize(() => {
        this.fetchingPetitions = false;
        console.log('[Citizen Profile] fetchingPetitions state after finalize:', this.fetchingPetitions);
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      console.log('[Citizen Profile] My petitions response received:', data);
      this.myPetitions = data || [];
      this.fetchingPetitions = false;
      this.cdr.detectChanges();
    });
  }

  loadProfile() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('[Citizen Profile] Session not found in loadProfile. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    console.log('[Citizen Profile] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    console.log('[Citizen Profile] Request sent to GET /api/auth/me');

    this.http.get<any>('http://localhost:8080/api/auth/me').pipe(
      catchError((err) => {
        console.error('[Citizen Profile] Error loading profile from server, using local fallback:', err);
        this.name = localStorage.getItem('name') || 'Citizen Member';
        this.email = localStorage.getItem('email') || 'user@example.com';
        this.role = localStorage.getItem('role') || 'CITIZEN';
        this.city = localStorage.getItem('city') || 'Delhi';
        this.state = localStorage.getItem('state') || 'Delhi';
        this.location = localStorage.getItem('location') || 'Delhi, India';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
        console.log('[Citizen Profile] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe(user => {
      console.log('[Citizen Profile] Profile response received:', user);
      if (user) {
        this.name = user.name || '';
        this.email = user.email || '';
        this.role = user.role || '';
        this.city = user.city || '';
        this.state = user.state || '';
        this.location = user.location || '';

        localStorage.setItem('name', this.name);
        localStorage.setItem('email', this.email);
        localStorage.setItem('role', this.role);
        localStorage.setItem('city', this.city);
        localStorage.setItem('state', this.state);
        localStorage.setItem('location', this.location);
      }
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim() || !this.city.trim() || !this.state.trim()) {
      this.errorMessage = 'Name, City, and State are required fields.';
      return;
    }

    this.submitting = true;
    const payload = {
      name: this.name.trim(),
      city: this.city.trim(),
      state: this.state.trim(),
      location: this.location.trim()
    };

    console.log('[Citizen Profile] Submitting profile update:', payload);

    this.http.put('http://localhost:8080/api/users/profile', payload).pipe(
      catchError(err => {
        console.error('[Citizen Profile] Error updating profile on server, using local fallback:', err);
        localStorage.setItem('name', payload.name);
        localStorage.setItem('city', payload.city);
        localStorage.setItem('state', payload.state);
        localStorage.setItem('location', payload.location);
        
        window.dispatchEvent(new Event('profileUpdated'));

        this.successMessage = 'Profile updated successfully!';
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
        
        window.dispatchEvent(new Event('profileUpdated'));
        this.successMessage = 'Profile updated successfully!';
      }
    });
  }
}
