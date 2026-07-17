import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of, forkJoin } from 'rxjs';

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
    const location = localStorage.getItem('city') || 'Delhi';
    const userId = localStorage.getItem('id');

    if (!userId) {
      this.errorMessage = 'User session not found. Please log in again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const petitions$ = this.http.get<any[]>(`http://localhost:8080/api/petitions?location=${location}`);

    const polls$ = this.http.get<any[]>('http://localhost:8080/api/polls');

    const queries$ = this.http.get<any[]>(`http://localhost:8080/api/queries?officialId=${userId}`);

    forkJoin([petitions$, polls$, queries$]).subscribe({
      next: ([petitions, polls, queries]) => {
        this.pendingPetitionsCount = petitions.filter(p => p.status === 'UNDER_REVIEW' || p.status === 'ACTIVE').length;
        this.activePollsCount = polls.filter(p => p.status === 'ACTIVE').length;
        this.unresolvedQueriesCount = queries.filter(q => q.status === 'PENDING').length;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to sync with administrative database registers. Please try again.';
        this.loading = false;
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([`/official-dashboard/${path}`]);
  }
}
