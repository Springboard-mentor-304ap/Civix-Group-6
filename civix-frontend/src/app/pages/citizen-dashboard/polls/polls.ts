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
  isVoting?: boolean;
  selectedOption?: string;
  results: { [optionName: string]: number };
  status: 'ACTIVE' | 'CLOSED';
  targetVotes?: number;
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

  showVoteSuccessModal = false;
  votedPollTitle = '';
  votedOptionName = '';

  ngOnInit() {
    this.fetchPolls();
  }

  closeVoteModal() {
    this.showVoteSuccessModal = false;
    this.votedPollTitle = '';
    this.votedOptionName = '';
    this.cdr.detectChanges();
  }

  fetchPolls() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('[Citizen Polls] Session not found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = '';
    this.loading = true;
    this.cdr.detectChanges();

    this.http.get<any[]>('http://localhost:8080/api/polls').pipe(
      catchError((err) => {
        console.error('[Citizen Polls] Error fetching polls:', err);
        this.errorMessage = 'Failed to load consensus polls from the server.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      const rawPolls = data || [];

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
          isVoting: false,
          selectedOption: poll.selectedOption,
          results: resultsMap,
          status: pollStatus as 'ACTIVE' | 'CLOSED',
          targetVotes: poll.targetVotes || poll.voteGoal || 500
        };
      });

      this.activePolls = parsedPolls.filter(p => p.status === 'ACTIVE' || (p.status || '').toUpperCase() === 'ACTIVE');
      this.closedPolls = parsedPolls.filter(p => p.status === 'CLOSED' || (p.status || '').toUpperCase() === 'CLOSED');
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  castVote(poll: Poll, option: string) {
    if (!option) {
      this.errorMessage = 'Please select an option before voting.';
      this.cdr.detectChanges();
      return;
    }

    if (poll.userVoted || poll.isVoting) {
      return;
    }

    poll.isVoting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.detectChanges();

    const payload = { selectedOption: option };

    console.log(`[Citizen Polls] Casting vote for poll ${poll.id}:`, payload);

    this.http.post(`http://localhost:8080/api/polls/${poll.id}/vote`, payload, { responseType: 'text' }).pipe(
      catchError((err) => {
        console.error(`[Citizen Polls] Error submitting vote:`, err);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Session expired or unauthenticated. Please log out and log in again.';
        } else if (typeof err?.error === 'string' && err.error.length > 0) {
          this.errorMessage = err.error;
        } else {
          this.errorMessage = err?.error?.message || 'Failed to submit vote. Please try again.';
        }
        this.cdr.detectChanges();
        return of(null);
      }),
      finalize(() => {
        poll.isVoting = false;
        this.cdr.detectChanges();
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
        
        // Show Vote Confirmation Modal Popup (without exposing any internal IDs)
        this.votedPollTitle = poll.title;
        this.votedOptionName = option;
        this.showVoteSuccessModal = true;
        this.cdr.detectChanges();
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
