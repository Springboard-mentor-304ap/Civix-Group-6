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
  messageText = '';
  priorityValue = 'NORMAL';
  showModal = false;

  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.fetchOfficials();
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
    this.messageText = '';
    this.priorityValue = 'NORMAL';
    this.showModal = true;
  }

  closeMessageModal() {
    this.showModal = false;
    this.selectedOfficial = null;
    this.messageText = '';
  }

  sendMessage() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.messageText.trim()) {
      this.errorMessage = 'Please type a message before sending.';
      return;
    }

    if (!this.selectedOfficial) return;

    this.submitting = true;
    const payload = {
      officialId: this.selectedOfficial.id,
      message: this.messageText.trim(),
      priority: this.priorityValue
    };

    console.log(`[Citizen Officials] Sending message to official ${this.selectedOfficial.id}:`, payload);

    this.http.post('http://localhost:8080/api/queries', payload).pipe(
      catchError((err) => {
        console.error('[Citizen Officials] Error sending message:', err);
        this.errorMessage = 'Failed to send query. Try again later.';
        return of(null);
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe((res) => {
      if (res !== null) {
        this.successMessage = `Your message has been successfully sent to ${this.selectedOfficial?.name}!`;
        this.closeMessageModal();
      }
    });
  }
}
