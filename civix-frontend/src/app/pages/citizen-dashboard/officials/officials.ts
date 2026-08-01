import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

interface Official {
  id: number;
  name: string;
  email: string;
  city: string;
  state: string;
  role: string;
}

@Component({
  selector: 'app-citizen-officials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './officials.html',
  styleUrl: './officials.css'
})
export class CitizenOfficialsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  officials: Official[] = [];
  filteredOfficials: Official[] = [];

  searchText = '';

  // Message modal state
  selectedOfficial: Official | null = null;
  subjectTitle = '';
  messageText = '';
  priorityValue = 'NORMAL';
  showModal = false;

  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  // Sent queries & responses
  myQueries: any[] = [];
  fetchingQueries = false;

  ngOnInit() {
    this.fetchOfficials();
    this.fetchMyQueries();
  }

  fetchMyQueries() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) return;

    this.fetchingQueries = true;
    this.cdr.detectChanges();

    this.http.get<any[]>(`http://localhost:8080/api/queries?citizenId=${userId}`).pipe(
      catchError((err) => {
        console.error('[Citizen Officials] Error fetching my queries:', err);
        return of([]);
      }),
      finalize(() => {
        this.fetchingQueries = false;
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      this.myQueries = data || [];
      this.fetchingQueries = false;
      this.cdr.detectChanges();
    });
  }

  fetchOfficials() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('[Citizen Officials] Session not found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = '';
    console.log('[Citizen Officials] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    console.log('[Citizen Officials] Request sent');

    this.http.get<Official[]>('http://localhost:8080/api/users?role=OFFICIAL').pipe(
      catchError((err) => {
        console.error('[Citizen Officials] Error fetching officials:', err);
        this.errorMessage = 'Failed to load verified public officials.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        console.log('[Citizen Officials] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      console.log('[Citizen Officials] Response received:', data);
      const rawOfficials = data || [];
      console.log('[Citizen Officials] Array length:', rawOfficials.length);
      this.officials = rawOfficials.map(o => ({
        id: o.id,
        name: o.name || 'Verified Official',
        email: o.email || 'official@gov.in',
        city: o.city || 'Delhi',
        state: o.state || 'Delhi',
        role: o.role || 'OFFICIAL'
      }));
      this.applyFilter();
      this.loading = false;
      console.log('[Citizen Officials] Template collection length (filteredOfficials.length):', this.filteredOfficials.length);
      this.cdr.detectChanges();
    });
  }

  applyFilter() {
    if (!this.searchText.trim()) {
      this.filteredOfficials = this.officials;
      return;
    }
    const query = this.searchText.toLowerCase().trim();
    this.filteredOfficials = this.officials.filter(o => 
      (o.name || '').toLowerCase().includes(query) || 
      (o.city && o.city.toLowerCase().includes(query)) || 
      (o.state && o.state.toLowerCase().includes(query))
    );
  }

  openMessageModal(official: Official) {
    this.selectedOfficial = official;
    this.subjectTitle = '';
    this.messageText = '';
    this.priorityValue = 'NORMAL';
    this.showModal = true;
    this.cdr.detectChanges();
  }

  closeMessageModal() {
    this.showModal = false;
    this.selectedOfficial = null;
    this.subjectTitle = '';
    this.messageText = '';
    this.cdr.detectChanges();
  }

  sendMessage() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.subjectTitle.trim() || !this.messageText.trim()) {
      this.errorMessage = 'Please provide both a Subject Heading and Message Description.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.selectedOfficial) return;

    this.submitting = true;
    this.cdr.detectChanges();

    const formattedMessage = `Subject: ${this.subjectTitle.trim()}\n\n${this.messageText.trim()}`;

    const payload = {
      officialId: this.selectedOfficial.id,
      message: formattedMessage,
      priority: this.priorityValue
    };

    console.log(`[Citizen Officials] Sending message to official ${this.selectedOfficial.id}:`, payload);

    this.http.post('http://localhost:8080/api/queries', payload).pipe(
      catchError((err) => {
        console.error('[Citizen Officials] Error sending message:', err);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Session expired or unauthenticated. Please log out and log in again.';
        } else {
          this.errorMessage = err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'Failed to send query. Try again later.';
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
        this.successMessage = `Your message has been successfully sent to ${this.selectedOfficial?.name}!`;
        this.closeMessageModal();
        this.fetchMyQueries();
        this.cdr.detectChanges();
      }
    });
  }
}
