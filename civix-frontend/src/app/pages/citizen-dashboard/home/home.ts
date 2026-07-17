import { Component, OnInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of, forkJoin } from 'rxjs';

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
  }

  ngOnInit() {
    this.fetchDashboardStats();
  }

  fetchDashboardStats() {
    const userId = localStorage.getItem('id');
    if (!userId) {
      this.errorMessage = 'User session not found. Please log in again.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const petitions$ = this.http.get<number>(`http://localhost:8080/api/petitions/count/active?userId=${userId}`);

    const polls$ = this.http.get<number>(`http://localhost:8080/api/polls/count/participated?userId=${userId}`);

    const responses$ = this.http.get<number>(`http://localhost:8080/api/queries/count/responses?citizenId=${userId}`);

    forkJoin([petitions$, polls$, responses$]).subscribe({
      next: ([petitionsCount, pollsCount, responsesCount]) => {
        this.activePetitionsCount = petitionsCount;
        this.pollsParticipatedCount = pollsCount;
        this.officialResponsesCount = responsesCount;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to sync with civic registry database. Please check your credentials and try again.';
        this.loading = false;
      }
    });
  }

  navigateTo(path: string) {
    this.router.navigate([`/citizen-dashboard/${path}`]);
  }
}
