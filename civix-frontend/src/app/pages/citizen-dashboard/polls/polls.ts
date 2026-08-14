import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  private readonly cdr = inject(ChangeDetectorRef);

  activeTab: 'ACTIVE' | 'CLOSED' = 'ACTIVE';

  allPolls: Poll[] = [];
  filteredActivePolls: Poll[] = [];
  filteredClosedPolls: Poll[] = [];

  searchText = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.fetchPolls();
  }

  fetchPolls() {
    this.errorMessage = '';
    this.loading = true;
    this.http.get<any[]>('http://localhost:8080/api/polls')
      .pipe(
        catchError(() => of([])),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          const rawList = data || [];
          this.allPolls = rawList.map(poll => {
            let optionsList: string[] = [];
            if (Array.isArray(poll.options)) {
              optionsList = poll.options;
            } else if (typeof poll.options === 'string') {
              try {
                optionsList = JSON.parse(poll.options);
              } catch (e) {
                optionsList = poll.options.split(',').map((s: string) => s.trim());
              }
            }
            
            let resultsMap = poll.results || {};
            if (typeof resultsMap === 'string') {
              try { resultsMap = JSON.parse(resultsMap); } catch(e) {}
            }

            return {
              id: poll.id,
              title: poll.title,
              description: poll.description,
              options: optionsList.length > 0 ? optionsList : ['Yes', 'No'],
              startDate: poll.startDate,
              endDate: poll.endDate,
              userVoted: !!poll.userVoted,
              selectedOption: poll.selectedOption,
              results: resultsMap,
              status: (poll.status || 'ACTIVE').toUpperCase() as 'ACTIVE' | 'CLOSED'
            };
          });

          this.applyFilter();
        },
        error: () => {
          this.allPolls = [];
          this.filteredActivePolls = [];
          this.filteredClosedPolls = [];
        }
      });
  }

  setTab(tab: 'ACTIVE' | 'CLOSED') {
    this.activeTab = tab;
  }

  applyFilter() {
    let list = this.allPolls;
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase().trim();
      list = list.filter(p => (p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }

    this.filteredActivePolls = list.filter(p => p.status === 'ACTIVE');
    this.filteredClosedPolls = list.filter(p => p.status === 'CLOSED');
  }

  castVote(poll: Poll, option: string) {
    if (!option) {
      this.errorMessage = 'Please select an option before voting.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const payload = { selectedOption: option };

    this.http.post(`http://localhost:8080/api/polls/${poll.id}/vote`, payload).subscribe({
      next: () => {
        poll.userVoted = true;
        poll.selectedOption = option;
        if (!poll.results[option]) {
          poll.results[option] = 0;
        }
        poll.results[option]++;
        this.successMessage = 'Your vote has been cast successfully!';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error || 'Failed to submit vote. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  getOptionPercentage(poll: Poll, option: string): number {
    const totalVotes = Object.values(poll.results).reduce((a, b) => a + b, 0);
    if (totalVotes === 0) return 0;
    const votes = poll.results[option] || 0;
    return Math.round((votes / totalVotes) * 100);
  }

  getOptionVotes(poll: Poll, option: string): number {
    return poll.results?.[option] || 0;
  }

  getTotalVotes(poll: Poll): number {
    return Object.values(poll.results || {}).reduce((a, b) => a + b, 0);
  }

  getWinningOption(poll: Poll): string {
    if (!poll.results || Object.keys(poll.results).length === 0) return '';
    let maxVotes = -1;
    let winner = '';
    for (const opt of poll.options) {
      const votes = poll.results[opt] || 0;
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = opt;
      }
    }
    return winner;
  }

  isWinner(poll: Poll, option: string): boolean {
    const total = this.getTotalVotes(poll);
    if (total === 0) return false;
    return this.getWinningOption(poll) === option;
  }
}
