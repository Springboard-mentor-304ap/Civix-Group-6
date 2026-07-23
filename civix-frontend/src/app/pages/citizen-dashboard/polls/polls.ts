import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

interface Poll {
  id: number;
  title: string;
  description: string;
  options: string[];
  startDate: string;
  endDate: string;
  userVoted: boolean;
  selectedOption?: string;
  results: { [optionName: string]: number };
  status: 'ACTIVE' | 'CLOSED';
}

@Component({
  selector: 'app-citizen-polls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './polls.html',
  styleUrl: './polls.css'
})
export class CitizenPollsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  activePolls: Poll[] = [];
  closedPolls: Poll[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.fetchPolls();
  }

  fetchPolls() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('[Citizen Polls] Session not found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = '';
    console.log('[Citizen Polls] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    console.log('[Citizen Polls] Request sent');

    this.http.get<any[]>('http://localhost:8080/api/polls').pipe(
      catchError((err) => {
        console.error('[Citizen Polls] Error fetching polls:', err);
        this.errorMessage = 'Failed to load consensus polls from the server.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        console.log('[Citizen Polls] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      console.log('[Citizen Polls] Response received:', data);
      const rawPolls = data || [];
      console.log('[Citizen Polls] Array length:', rawPolls.length);

      const parsedPolls: Poll[] = rawPolls.map(poll => {
        let optionsList: string[] = [];
        if (Array.isArray(poll?.options)) {
          optionsList = poll.options;
        } else if (typeof poll?.options === 'string') {
          try {
            optionsList = JSON.parse(poll.options);
          } catch (e) {
            optionsList = poll.options.split(',').map((s: string) => s.trim());
          }
        }
        
        let resultsMap: { [key: string]: number } = {};
        if (poll?.results && typeof poll.results === 'object') {
          resultsMap = poll.results;
        } else if (typeof poll?.results === 'string') {
          try { resultsMap = JSON.parse(poll.results); } catch(e) {}
        }

        const pollStatus = poll?.status || 'ACTIVE';

        return {
          id: poll.id,
          title: poll.title || 'Untitled Poll',
          description: poll.description || '',
          options: optionsList.length > 0 ? optionsList : ['Yes', 'No'],
          startDate: poll.startDate || new Date().toISOString(),
          endDate: poll.endDate || new Date().toISOString(),
          userVoted: !!poll.userVoted,
          selectedOption: poll.selectedOption,
          results: resultsMap,
          status: pollStatus as 'ACTIVE' | 'CLOSED'
        };
      });

      this.activePolls = parsedPolls.filter(p => p.status === 'ACTIVE' || (p.status || '').toUpperCase() === 'ACTIVE');
      this.closedPolls = parsedPolls.filter(p => p.status === 'CLOSED' || (p.status || '').toUpperCase() === 'CLOSED');
      this.loading = false;
      console.log('[Citizen Polls] Active polls count:', this.activePolls.length, 'Closed polls count:', this.closedPolls.length);
      this.cdr.detectChanges();
    });
  }

  castVote(poll: Poll, option: string) {
    if (!option) {
      this.errorMessage = 'Please select an option before voting.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const payload = { selectedOption: option };

    console.log(`[Citizen Polls] Casting vote for poll ${poll.id}:`, payload);

    this.http.post(`http://localhost:8080/api/polls/${poll.id}/vote`, payload).pipe(
      catchError((err) => {
        console.error(`[Citizen Polls] Error submitting vote for poll ${poll.id}:`, err);
        this.errorMessage = err?.error || 'Failed to submit vote. Please try again.';
        return of(null);
      })
    ).subscribe((res) => {
      if (res !== null) {
        poll.userVoted = true;
        poll.selectedOption = option;
        if (!poll.results[option]) {
          poll.results[option] = 0;
        }
        poll.results[option]++;
        this.successMessage = 'Your vote has been cast successfully!';
      }
    });
  }

  getOptionPercentage(poll: Poll, option: string): number {
    if (!poll?.results) return 0;
    const totalVotes = Object.values(poll.results).reduce((a, b) => a + b, 0);
    if (totalVotes === 0) return 0;
    const votes = poll.results[option] || 0;
    return Math.round((votes / totalVotes) * 100);
  }

  getTotalVotes(poll: Poll): number {
    if (!poll?.results) return 0;
    return Object.values(poll.results).reduce((a, b) => a + b, 0);
  }
}
