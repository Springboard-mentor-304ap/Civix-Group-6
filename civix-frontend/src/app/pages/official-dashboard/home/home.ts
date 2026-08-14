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
  }

  ngOnInit() {
    this.fetchOfficialStats();
  }

  fetchOfficialStats() {
    const location = localStorage.getItem('city') || '';
    const userId = localStorage.getItem('id') || localStorage.getItem('userId') || '0';

    this.loading = true;
    this.errorMessage = '';

    const petitions$ = this.http.get<any[]>(`http://localhost:8080/api/petitions${location ? '?location=' + location : ''}`)
      .pipe(catchError(() => of([])));

    const polls$ = this.http.get<any[]>('http://localhost:8080/api/polls')
      .pipe(catchError(() => of([])));

    const queries$ = this.http.get<any[]>(`http://localhost:8080/api/queries?officialId=${userId}`)
      .pipe(catchError(() => of([])));

    forkJoin([petitions$, polls$, queries$])
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ([petitions, polls, queries]) => {
          this.pendingPetitionsCount = (petitions || []).filter(p => p.status === 'UNDER_REVIEW' || p.status === 'ACTIVE').length;
          this.activePollsCount = (polls || []).filter(p => p.status === 'ACTIVE').length;
          this.unresolvedQueriesCount = (queries || []).filter(q => q.status === 'PENDING').length;
        },
        error: () => {
          this.errorMessage = 'Failed to load official dashboard stats.';
        }
      });
  }

  navigateTo(path: string) {
    this.router.navigate([`/official-dashboard/${path}`]);
  }
}
