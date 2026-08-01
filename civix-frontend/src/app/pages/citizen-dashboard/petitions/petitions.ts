import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

interface Petition {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  targetSignatures: number;
  currentSignatures: number;
  status: string;
  signedByMe?: boolean;
  officialResponse?: string;
}

@Component({
  selector: 'app-citizen-petitions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './petitions.html',
  styleUrl: './petitions.css'
})
export class CitizenPetitionsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  petitions: Petition[] = [];
  filteredPetitions: Petition[] = [];

  // Filter values
  selectedCategory = '';
  selectedLocation = '';

  // Form values for new petition
  showCreateModal = false;
  newTitle = '';
  newDescription = '';
  newCategory = 'Environment';
  newLocation = '';
  newTargetSignatures = 1000;

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  // Reference lists for filter menus
  categories = ['Environment', 'Infrastructure', 'Sanitation', 'Safety', 'Education'];
  locations = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];

  ngOnInit() {
    this.loadPetitions();
  }

  loadPetitions() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('[Citizen Petitions] Session not found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = '';
    console.log('[Citizen Petitions] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    console.log('[Citizen Petitions] Request sent');

    this.http.get<Petition[]>('http://localhost:8080/api/petitions').pipe(
      catchError((err) => {
        console.error('[Citizen Petitions] Error fetching petitions:', err);
        this.errorMessage = 'Failed to load petitions from the server.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        console.log('[Citizen Petitions] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      console.log('[Citizen Petitions] Response received:', data);
      const rawPetitions = data || [];
      console.log('[Citizen Petitions] Array length:', rawPetitions.length);
      this.petitions = rawPetitions.map(p => ({
        ...p,
        title: p.title || 'Untitled Petition',
        description: p.description || '',
        status: p.status || 'ACTIVE',
        category: p.category || 'Environment',
        location: p.location || 'Delhi',
        currentSignatures: p.currentSignatures || 0,
        targetSignatures: p.targetSignatures || 1000
      }));
      this.applyFilters();
      this.loading = false;
      console.log('[Citizen Petitions] Template collection length (filteredPetitions.length):', this.filteredPetitions.length);
      this.cdr.detectChanges();
    });
  }

  applyFilters() {
    this.filteredPetitions = this.petitions.filter(p => {
      const matchCat = !this.selectedCategory || (p.category || '').toLowerCase() === this.selectedCategory.toLowerCase();
      const matchLoc = !this.selectedLocation || (p.location || '').toLowerCase().includes(this.selectedLocation.toLowerCase());
      return matchCat && matchLoc;
    });
    this.cdr.detectChanges();
  }

  signPetition(petition: Petition) {
    this.errorMessage = '';
    this.successMessage = '';
    
    console.log(`[Citizen Petitions] Signing petition ${petition.id}...`);

    this.http.post(`http://localhost:8080/api/petitions/${petition.id}/sign`, {}).pipe(
      catchError((err) => {
        console.error(`[Citizen Petitions] Error signing petition ${petition.id}:`, err);
        this.errorMessage = err?.error || 'Failed to sign the petition. Try again later.';
        return of(null);
      })
    ).subscribe((res) => {
      if (res !== null) {
        petition.currentSignatures++;
        petition.signedByMe = true;
        this.successMessage = `Successfully signed: "${petition.title}"!`;
        this.applyFilters();
      }
    });
  }

  openModal() {
    this.showCreateModal = true;
  }

  closeModal() {
    this.showCreateModal = false;
    this.newTitle = '';
    this.newDescription = '';
    this.newCategory = 'Environment';
    this.newLocation = '';
    this.newTargetSignatures = 1000;
  }

  onCreatePetition() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newTitle.trim() || !this.newDescription.trim() || !this.newLocation.trim()) {
      this.errorMessage = 'Please fill out all required fields.';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    const payload = {
      title: this.newTitle.trim(),
      description: this.newDescription.trim(),
      category: this.newCategory,
      location: this.newLocation.trim(),
      targetSignatures: this.newTargetSignatures
    };

    console.log('[Citizen Petitions] Creating petition:', payload);

    this.http.post<Petition>('http://localhost:8080/api/petitions', payload).pipe(
      catchError((err) => {
        console.error('[Citizen Petitions] Error creating petition:', err);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Session expired or unauthenticated. Please log out and log in again.';
        } else {
          this.errorMessage = err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'Failed to create new petition.';
        }
        this.cdr.detectChanges();
        return of(null);
      }),
      finalize(() => {
        this.submitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe((res) => {
      if (res !== null) {
        console.log('Successfully created petition:', res);
        this.successMessage = `Petition "${payload.title}" created successfully!`;
        this.closeModal();
        this.loadPetitions();
      }
    });
  }
}
