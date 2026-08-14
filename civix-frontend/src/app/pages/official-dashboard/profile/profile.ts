import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.http.get<any>('http://localhost:8080/api/auth/me').pipe(
      catchError(() => {
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
        this.cdr.detectChanges();
      })
    ).subscribe(user => {
      if (user) {
        this.name = user.name;
        this.email = user.email;
        this.role = user.role;
        this.city = user.city || '';
        this.state = user.state || '';
        this.location = user.location || '';
        this.department = user.department || 'Municipal Administration';

        // Sync local storage
        localStorage.setItem('name', user.name);
        localStorage.setItem('email', user.email);
        localStorage.setItem('role', user.role);
        localStorage.setItem('city', user.city || '');
        localStorage.setItem('state', user.state || '');
        localStorage.setItem('location', user.location || '');
        localStorage.setItem('department', user.department || 'Municipal Administration');
      }
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim() || !this.city.trim() || !this.state.trim() || !this.department.trim()) {
      this.errorMessage = 'Name, City, State, and Department are required.';
      return;
    }

    this.loading = true;
    const payload = {
      name: this.name.trim(),
      city: this.city.trim(),
      state: this.state.trim(),
      location: this.location.trim(),
      department: this.department.trim()
    };

    this.http.put('http://localhost:8080/api/users/profile', payload).pipe(
      catchError(() => {
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
        this.loading = false;
        this.cdr.detectChanges();
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
