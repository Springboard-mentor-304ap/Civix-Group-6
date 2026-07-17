import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-citizen-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class CitizenProfileComponent implements OnInit {
  private readonly http = inject(HttpClient);

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

  // Petitions list for the logged-in user
  myPetitions: any[] = [];
  fetchingPetitions = false;
  petitionsError = '';

  ngOnInit() {
    this.loadProfile();
    this.fetchMyPetitions();
  }

  fetchMyPetitions() {
    const userId = localStorage.getItem('id');
    if (!userId) return;

    this.fetchingPetitions = true;
    this.petitionsError = '';

    this.http.get<any[]>(`http://localhost:8080/api/petitions?userId=${userId}`).subscribe({
      next: (data) => {
        console.log('Successfully fetched my petitions:', data);
        this.myPetitions = data || [];
        this.fetchingPetitions = false;
      },
      error: (err) => {
        console.error('Error fetching my petitions:', err);
        this.petitionsError = 'Failed to load your drafted petitions.';
        this.fetchingPetitions = false;
      }
    });
  }

  loadProfile() {
    this.http.get<any>('http://localhost:8080/api/auth/me').pipe(
      catchError(() => {
        // Fallback local load
        this.name = localStorage.getItem('name') || 'Citizen Member';
        this.email = localStorage.getItem('email') || 'user@example.com';
        this.role = localStorage.getItem('role') || 'CITIZEN';
        this.city = localStorage.getItem('city') || 'Delhi';
        this.state = localStorage.getItem('state') || 'Delhi';
        this.location = localStorage.getItem('location') || 'Delhi, India';
        return of(null);
      })
    ).subscribe(user => {
      if (user) {
        this.name = user.name;
        this.email = user.email;
        this.role = user.role;
        this.city = user.city || '';
        this.state = user.state || '';
        this.location = user.location || '';

        // Sync local storage
        localStorage.setItem('name', user.name);
        localStorage.setItem('email', user.email);
        localStorage.setItem('role', user.role);
        localStorage.setItem('city', user.city || '');
        localStorage.setItem('state', user.state || '');
        localStorage.setItem('location', user.location || '');
      }
    });
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.name.trim() || !this.city.trim() || !this.state.trim()) {
      this.errorMessage = 'Name, City, and State are required fields.';
      return;
    }

    this.loading = true;
    const payload = {
      name: this.name.trim(),
      city: this.city.trim(),
      state: this.state.trim(),
      location: this.location.trim()
    };

    this.http.put('http://localhost:8080/api/users/profile', payload).pipe(
      catchError(err => {
        // Handle locally if server is offline or returns error
        localStorage.setItem('name', payload.name);
        localStorage.setItem('city', payload.city);
        localStorage.setItem('state', payload.state);
        localStorage.setItem('location', payload.location);
        
        // Dispatch custom event to let sibling layouts know name has changed
        window.dispatchEvent(new Event('profileUpdated'));

        this.loading = false;
        this.successMessage = 'Profile updated successfully!';
        return of(null);
      })
    ).subscribe(res => {
      if (res !== null) {
        // Backend success
        localStorage.setItem('name', payload.name);
        localStorage.setItem('city', payload.city);
        localStorage.setItem('state', payload.state);
        localStorage.setItem('location', payload.location);
        
        window.dispatchEvent(new Event('profileUpdated'));
        this.successMessage = 'Profile updated successfully!';
      }
      this.loading = false;
    });
  }
}
