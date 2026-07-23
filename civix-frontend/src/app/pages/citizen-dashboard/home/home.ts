import { Component, OnInit, inject, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of, forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'app-citizen-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class CitizenHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  username = localStorage.getItem('name') || 'Citizen Member';
  email = localStorage.getItem('email') || 'user@example.com';
  role = localStorage.getItem('role') || 'CITIZEN';

  activePetitionsCount = 0;
  pollsParticipatedCount = 0;
  officialResponsesCount = 0;

  loading = false;
  errorMessage = '';

  @HostListener('window:profileUpdated')
  onProfileUpdated() {
    this.username = localStorage.getItem('name') || 'Citizen Member';
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.fetchDashboardStats();
  }

  fetchDashboardStats() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('[Citizen Home] Session not found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    console.log('[Citizen Home] Loading state before request:', this.loading);
    this.loading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    console.log(`[Citizen Home] Request sent for userId: ${userId}`);

    const petitions$ = this.http.get<number>(`http://localhost:8080/api/petitions/count/active?userId=${userId}`).pipe(
      catchError(err => {
        console.error('[Citizen Home] Error fetching active petitions count:', err);
        return of(0);
      })
    );

    const polls$ = this.http.get<number>(`http://localhost:8080/api/polls/count/participated?userId=${userId}`).pipe(
      catchError(err => {
        console.error('[Citizen Home] Error fetching polls count:', err);
        return of(0);
      })
    );

    const responses$ = this.http.get<number>(`http://localhost:8080/api/queries/count/responses?citizenId=${userId}`).pipe(
      catchError(err => {
        console.error('[Citizen Home] Error fetching responses count:', err);
        return of(0);
      })
    );

    forkJoin([petitions$, polls$, responses$]).pipe(
      finalize(() => {
        this.loading = false;
        console.log('[Citizen Home] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ([petitionsCount, pollsCount, responsesCount]) => {
        console.log('[Citizen Home] Response received:', { petitionsCount, pollsCount, responsesCount });
        this.activePetitionsCount = petitionsCount || 0;
        this.pollsParticipatedCount = pollsCount || 0;
        this.officialResponsesCount = responsesCount || 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Citizen Home] Unexpected error in forkJoin:', err);
        this.errorMessage = 'Failed to sync with civic registry database.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([`/citizen-dashboard/${path}`]);
  }
}
