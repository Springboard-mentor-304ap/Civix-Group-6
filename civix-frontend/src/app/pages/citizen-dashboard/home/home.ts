import { Component, OnInit, inject, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { catchError, of, forkJoin, finalize } from 'rxjs';

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
  status: string;
  signedByMe?: boolean;
  officialResponse?: string;
  createdAt?: string;
}

interface Poll {
  id: number;
  title: string;
  description: string;
  options: string[];
  userVoted?: boolean;
  status: string;
}

interface Activity {
  id: number;
  icon: string;
  title: string;
  time: string;
  type: 'petition' | 'poll' | 'system';
}

@Component({
  selector: 'app-citizen-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  selectedLocation = 'All Locations';
  selectedCategory = 'All';

  categories = ['All', 'Environment', 'Infrastructure', 'Sanitation', 'Safety', 'Education'];
  locations = ['All Locations', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];

  myPetitionsCount = 0;
  signedPetitionsCount = 0;
  pollsParticipatedCount = 0;
  totalSignaturesCount = 0;

  petitions: Petition[] = [];
  filteredPetitions: Petition[] = [];
  polls: Poll[] = [];
  activities: Activity[] = [];

  loading = false;
  errorMessage = '';

  @HostListener('window:profileUpdated')
  onProfileUpdated() {
    this.username = localStorage.getItem('name') || 'Citizen Member';
    this.email = localStorage.getItem('email') || 'user@example.com';
  }

  ngOnInit() {
    this.fetchDashboardData();
  }

  fetchDashboardData() {
    this.loading = true;
    this.errorMessage = '';
    const userId = localStorage.getItem('id') || localStorage.getItem('userId') || '0';

    const petitions$ = this.http.get<Petition[]>('http://localhost:8080/api/petitions')
      .pipe(catchError(() => of([])));

    const polls$ = this.http.get<any[]>('http://localhost:8080/api/polls')
      .pipe(catchError(() => of([])));

    const pollsCount$ = this.http.get<number>(`http://localhost:8080/api/polls/count/participated?userId=${userId}`)
      .pipe(catchError(() => of(0)));

    forkJoin([petitions$, polls$, pollsCount$])
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: ([petitionsData, pollsData, countParticipated]) => {
          const uid = Number(userId);
          
          this.petitions = petitionsData || [];
          this.polls = (pollsData || []).map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            options: Array.isArray(p.options) ? p.options : [],
            userVoted: !!p.userVoted,
            status: p.status || 'ACTIVE'
          }));

          this.myPetitionsCount = this.petitions.filter(p => p.creatorId === uid).length;
          this.signedPetitionsCount = this.petitions.filter(p => p.signedByMe).length;
          this.pollsParticipatedCount = countParticipated || this.polls.filter(p => p.userVoted).length;
          this.totalSignaturesCount = this.petitions.reduce((acc, p) => acc + (p.currentSignatures || 0), 0);

          this.applyFilters();
          this.buildRecentActivities();
        },
        error: () => {
          this.errorMessage = 'Failed to load dashboard data.';
        }
      });
  }

  selectCategory(cat: string) {
    this.selectedCategory = cat;
    this.applyFilters();
  }

  onLocationChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedLocation = select.value;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredPetitions = this.petitions.filter(p => {
      const matchCat = this.selectedCategory === 'All' || (p.category || '').toLowerCase() === this.selectedCategory.toLowerCase();
      const matchLoc = this.selectedLocation === 'All Locations' || (p.location || '').toLowerCase().includes(this.selectedLocation.toLowerCase());
      return matchCat && matchLoc;
    });
  }

  getProgressPercent(petition: Petition): number {
    const target = petition.targetSignatures || 100;
    const current = petition.currentSignatures || 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  buildRecentActivities() {
    const list: Activity[] = [];
    if (this.petitions.length > 0) {
      list.push({
        id: 1,
        icon: '📜',
        title: `Latest petition: "${this.petitions[0].title}" launched`,
        time: 'Recently',
        type: 'petition'
      });
    }
    if (this.polls.length > 0) {
      list.push({
        id: 2,
        icon: '🗳️',
        title: `Active community decision: "${this.polls[0].title}"`,
        time: 'Active now',
        type: 'poll'
      });
    }
    list.push({
      id: 3,
      icon: '🏛️',
      title: 'Civic registry credentials synced successfully',
      time: 'Just now',
      type: 'system'
    });
    this.activities = list;
  }

  navigateTo(path: string, tab?: 'ALL' | 'MY' | 'SIGNED') {
    if (tab) {
      this.router.navigate([`/citizen-dashboard/${path}`], { queryParams: { tab } });
    } else {
      this.router.navigate([`/citizen-dashboard/${path}`]);
    }
  }
}

