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
  results: { [optionName: string]: number };
  status: 'ACTIVE' | 'CLOSED';
}

@Component({
  selector: 'app-official-polls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './polls.html',
  styleUrl: './polls.css'
})
export class OfficialPollsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  polls: Poll[] = [];

  showCreateModal = false;

  // New poll form values
  newTitle = '';
  newDescription = '';
  newOptions: string[] = ['', ''];
  newStartDate = '';
  newEndDate = '';

  loading = false;
  submitting = false;
  closingMap: { [id: number]: boolean } = {};
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
          this.polls = rawList.map(poll => {
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
              results: resultsMap,
              status: poll.status || 'ACTIVE'
            };
          });
        },
        error: () => {
          this.errorMessage = 'Failed to load polls from the server.';
        }
      });
  }

  closePoll(poll: Poll) {
    this.errorMessage = '';
    this.successMessage = '';
    this.closingMap[poll.id] = true;

    this.http.patch(`http://localhost:8080/api/polls/${poll.id}/close`, {}).subscribe({
      next: () => {
        poll.status = 'CLOSED';
        this.successMessage = `Successfully closed the poll: "${poll.title}"!`;
        this.fetchPolls(); // reload
        this.closingMap[poll.id] = false;
      },
      error: (err) => {
        this.errorMessage = err?.error || 'Failed to close the poll. Try again later.';
        this.closingMap[poll.id] = false;
      }
    });
  }

  openModal() {
    this.showCreateModal = true;
  }

  closeModal() {
    this.showCreateModal = false;
    this.newTitle = '';
    this.newDescription = '';
    this.newOptions = ['', ''];
    this.newStartDate = '';
    this.newEndDate = '';
  }

  addOptionInput() {
    this.newOptions.push('');
  }

  removeOptionInput(index: number) {
    if (this.newOptions.length > 2) {
      this.newOptions.splice(index, 1);
    }
  }

  trackByIndex(index: number): number {
    return index;
  }

  onCreatePoll() {
    this.errorMessage = '';
    this.successMessage = '';

    const validOptions = this.newOptions.map(o => o.trim()).filter(o => o !== '');

    if (!this.newTitle.trim() || !this.newDescription.trim() || !this.newStartDate || !this.newEndDate) {
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }

    if (validOptions.length < 2) {
      this.errorMessage = 'Please provide at least 2 non-empty options.';
      return;
    }

    this.submitting = true;
    const payload = {
      title: this.newTitle.trim(),
      description: this.newDescription.trim(),
      options: validOptions,
      startDate: this.newStartDate,
      endDate: this.newEndDate
    };

    this.http.post<any>('http://localhost:8080/api/polls', payload).subscribe({
      next: (res) => {
        this.successMessage = `Poll "${payload.title}" created successfully!`;
        this.closeModal();
        this.fetchPolls(); // reload
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to create and launch poll.';
        this.submitting = false;
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
