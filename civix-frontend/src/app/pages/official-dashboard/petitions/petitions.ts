import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

interface Petition {
  id: number;
  creatorId?: number;
  creatorName?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  targetSignatures: number;
  currentSignatures: number;
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED' | 'ACTIVE' | 'CLOSED';
  officialResponse?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-official-petitions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './petitions.html',
  styleUrl: './petitions.css'
})
export class OfficialPetitionsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  petitions: Petition[] = [];
  filteredPetitions: Petition[] = [];

  // Filter options
  searchLocation = '';
  selectedCategory = '';
  selectedStatus = '';

  loading = false;
  submittingMap: { [id: number]: boolean } = {};
  errorMessage = '';
  successMessage = '';

  // Options for petition statuses
  statusOptions = ['ACTIVE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED', 'CLOSED'];
  categories = ['Environment', 'Infrastructure', 'Sanitation', 'Safety', 'Education'];

  ngOnInit() {
    this.fetchPetitions();
  }

  fetchPetitions() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('[Official Petitions] Session not found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = '';
    console.log('[Official Petitions] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    // Fetch ALL petitions without restricting to a single hardcoded location string
    console.log('[Official Petitions] Sending HTTP GET /api/petitions');

    const host = typeof window !== 'undefined' && window.location && window.location.hostname ? window.location.hostname : 'localhost';
    this.http.get<Petition[]>(`http://${host}:8080/api/petitions`).pipe(
      catchError((error) => {
        console.error('[Official Petitions] HTTP GET /api/petitions Error:', error);
        this.errorMessage = 'Failed to load community petitions from the database.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        console.log('[Official Petitions] Loading finalized state:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      console.log('[Official Petitions] Raw API response received:', data);
      const rawPetitions = data || [];
      console.log('[Official Petitions] Total petitions count from DB:', rawPetitions.length);

      this.petitions = rawPetitions.map(p => ({
        ...p,
        creatorName: p.creatorName || 'Verified Citizen',
        status: (p.status || 'ACTIVE') as any,
        category: p.category || 'General',
        location: p.location || 'Municipal Region',
        currentSignatures: p.currentSignatures || 0,
        targetSignatures: p.targetSignatures || 1000,
        officialResponse: p.officialResponse || '',
        createdAt: p.createdAt || new Date().toISOString()
      }));

      this.applyFilters();
      this.loading = false;
      console.log('[Official Petitions] Final rendered collection length:', this.filteredPetitions.length);
      this.cdr.detectChanges();
    });
  }

  applyFilters() {
    this.filteredPetitions = this.petitions.filter(p => {
      const matchLoc = !this.searchLocation || (p.location || '').toLowerCase().includes(this.searchLocation.toLowerCase().trim());
      const matchCat = !this.selectedCategory || (p.category || '').toLowerCase() === this.selectedCategory.toLowerCase();
      const matchStat = !this.selectedStatus || (p.status || '').toUpperCase() === this.selectedStatus.toUpperCase();
      return matchLoc && matchCat && matchStat;
    });
    this.cdr.detectChanges();
  }

  quickUpdateStatus(petition: Petition, newStatus: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW' | 'RESOLVED') {
    petition.status = newStatus;
    this.updatePetitionStatus(petition);
  }

  updatePetitionStatus(petition: Petition) {
    this.errorMessage = '';
    this.successMessage = '';
    this.submittingMap[petition.id] = true;
    this.cdr.detectChanges();

    const payload = {
      status: petition.status,
      reply: petition.officialResponse?.trim() || ''
    };

    console.log(`[Official Petitions] Patching status for petition ${petition.id}:`, payload);

    this.http.patch(`http://localhost:8080/api/petitions/${petition.id}/status`, payload).pipe(
      catchError((err) => {
        console.error(`[Official Petitions] Error updating petition ${petition.id}:`, err);
        this.errorMessage = err?.error || 'Failed to update petition status.';
        return of(null);
      }),
      finalize(() => {
        this.submittingMap[petition.id] = false;
        this.cdr.detectChanges();
      })
    ).subscribe((res) => {
      if (res !== null) {
        this.successMessage = `Petition "${petition.title}" status updated to ${petition.status.replace('_', ' ')}!`;
        this.applyFilters();
      }
    });
  }
}
