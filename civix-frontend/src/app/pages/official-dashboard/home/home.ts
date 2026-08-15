import { Component, OnInit, inject, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of, forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'app-official-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class OfficialHomeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  username = localStorage.getItem('name') || 'Official Representative';
  email = localStorage.getItem('email') || 'official@gov.in';
  role = localStorage.getItem('role') || 'OFFICIAL';

  pendingPetitionsCount = 0;
  activePollsCount = 0;
  unresolvedQueriesCount = 0;

  loading = false;
  errorMessage = '';

  @HostListener('window:profileUpdated')
  onProfileUpdated() {
    this.username = localStorage.getItem('name') || 'Official Representative';
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.fetchOfficialStats();
  }

  fetchOfficialStats() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');

    if (!userId) {
      console.warn('Official session not found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    const location = localStorage.getItem('city') || 'Delhi';
    console.log('[Home] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    console.log(`[Home] Request sent for userId: ${userId}, location: ${location}`);

    const petitions$ = this.http.get<any[]>(`http://localhost:8080/api/petitions?location=${location}`).pipe(
      catchError(err => {
        console.error('[Home] Error fetching petitions for stats:', err);
        return of([]);
      })
    );

    const polls$ = this.http.get<any[]>('http://localhost:8080/api/polls').pipe(
      catchError(err => {
        console.error('[Home] Error fetching polls for stats:', err);
        return of([]);
      })
    );

    const queries$ = this.http.get<any[]>(`http://localhost:8080/api/queries?officialId=${userId}`).pipe(
      catchError(err => {
        console.error('[Home] Error fetching queries for stats:', err);
        return of([]);
      })
    );

    forkJoin([petitions$, polls$, queries$]).pipe(
      finalize(() => {
        this.loading = false;
        console.log('[Home] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: ([petitions, polls, queries]) => {
        console.log('[Home] Response received:', { petitions, polls, queries });
        const safePetitions = Array.isArray(petitions) ? petitions : [];
        const safePolls = Array.isArray(polls) ? polls : [];
        const safeQueries = Array.isArray(queries) ? queries : [];

        console.log('[Home] Collection lengths:', {
          petitionsLength: safePetitions.length,
          pollsLength: safePolls.length,
          queriesLength: safeQueries.length
        });

        this.pendingPetitionsCount = safePetitions.filter(p => p && (p.status === 'UNDER_REVIEW' || p.status === 'ACTIVE')).length;
        this.activePollsCount = safePolls.filter(p => p && p.status === 'ACTIVE').length;
        this.unresolvedQueriesCount = safeQueries.filter(q => q && q.status === 'PENDING').length;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Home] Unexpected error in forkJoin subscribe:', err);
        this.errorMessage = 'Failed to sync with administrative database registers.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([`/official-dashboard/${path}`]);
  }
}
