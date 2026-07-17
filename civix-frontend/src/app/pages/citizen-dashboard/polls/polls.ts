import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

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

  activePolls: Poll[] = [];
  closedPolls: Poll[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.fetchPolls();
  }

  fetchPolls() {
    this.errorMessage = '';
    this.loading = true;
    this.http.get<any[]>('http://localhost:8080/api/polls').subscribe({
      next: (data) => {
        const parsedPolls = data.map(poll => {
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
            status: poll.status || 'ACTIVE'
          };
        });

        this.activePolls = parsedPolls.filter(p => p.status === 'ACTIVE' || p.status.toUpperCase() === 'ACTIVE');
        this.closedPolls = parsedPolls.filter(p => p.status === 'CLOSED' || p.status.toUpperCase() === 'CLOSED');
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load consensus polls from the server.';
        this.loading = false;
      }
    });
  }

  castVote(poll: Poll, option: string) {
    if (!option) {
      this.errorMessage = 'Please select an option before voting.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const payload = { selectedOption: option }; // aligned with VoteRequest DTO field

    this.http.post(`http://localhost:8080/api/polls/${poll.id}/vote`, payload).subscribe({
      next: () => {
        poll.userVoted = true;
        poll.selectedOption = option;
        if (!poll.results[option]) {
          poll.results[option] = 0;
        }
        poll.results[option]++;
        this.successMessage = 'Your vote has been cast successfully!';
      },
      error: (err) => {
        this.errorMessage = err?.error || 'Failed to submit vote. Please try again.';
      }
    });
  }

  getOptionPercentage(poll: Poll, option: string): number {
    const totalVotes = Object.values(poll.results).reduce((a, b) => a + b, 0);
    if (totalVotes === 0) return 0;
    const votes = poll.results[option] || 0;
    return Math.round((votes / totalVotes) * 100);
  }

  getTotalVotes(poll: Poll): number {
    return Object.values(poll.results).reduce((a, b) => a + b, 0);
  }
}
