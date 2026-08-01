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
  results: { [optionName: string]: number };
  status: 'ACTIVE' | 'CLOSED';
  targetVotes?: number;
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
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  polls: Poll[] = [];

  showCreateModal = false;

  // New poll form values
  newTitle = '';
  newDescription = '';
  newOptions: string[] = ['', ''];
  newStartDate = '';
  newEndDate = '';
  newTargetVotes = 500;

  loading = false;
  submitting = false;
  closingMap: { [id: number]: boolean } = {};
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.fetchPolls();
  }

  fetchPolls() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('Official session not found in Polls. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = '';
    console.log('[Polls] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    console.log('[Polls] Request sent');

    this.http.get<any[]>('http://localhost:8080/api/polls').pipe(
      catchError((err) => {
        console.error('[Polls] Error fetching polls:', err);
        this.errorMessage = 'Failed to load polls from the server.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        console.log('[Polls] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      console.log('[Polls] Response received:', data);
      const rawPolls = data || [];
      console.log('[Polls] Array length:', rawPolls.length);
      this.polls = rawPolls.map(poll => {
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

        return {
          id: poll.id,
          title: poll.title || 'Untitled Poll',
          description: poll.description || '',
          options: optionsList.length > 0 ? optionsList : ['Yes', 'No'],
          startDate: poll.startDate || new Date().toISOString(),
          endDate: poll.endDate || new Date().toISOString(),
          results: resultsMap,
          status: poll.status || 'ACTIVE',
          targetVotes: poll.targetVotes || poll.voteGoal || 500
        };
      });
      this.loading = false;
      console.log('[Polls] Template collection length (polls.length):', this.polls.length);
      this.cdr.detectChanges();
    });
  }

  closePoll(poll: Poll) {
    this.errorMessage = '';
    this.successMessage = '';
    this.closingMap[poll.id] = true;
    this.cdr.detectChanges();

    console.log(`Closing poll ${poll.id}...`);

    this.http.patch(`http://localhost:8080/api/polls/${poll.id}/close`, {}).pipe(
      catchError((err) => {
        console.error(`Error closing poll ${poll.id}:`, err);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Session expired or unauthorized. Please log in again.';
        } else {
          this.errorMessage = err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'Failed to close the poll. Try again later.';
        }
        this.cdr.detectChanges();
        return of(null);
      }),
      finalize(() => {
        this.closingMap[poll.id] = false;
        this.cdr.detectChanges();
      })
    ).subscribe((res) => {
      if (res !== null) {
        poll.status = 'CLOSED';
        this.successMessage = `Successfully closed the poll: "${poll.title}"!`;
        this.fetchPolls();
      }
    });
  }

  openModal() {
    this.showCreateModal = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    this.showCreateModal = false;
    this.newTitle = '';
    this.newDescription = '';
    this.newOptions = ['', ''];
    this.newStartDate = '';
    this.newEndDate = '';
    this.newTargetVotes = 500;
    this.cdr.detectChanges();
  }

  addOptionInput() {
    this.newOptions.push('');
    this.cdr.detectChanges();
  }

  removeOptionInput(index: number) {
    if (this.newOptions.length > 2) {
      this.newOptions.splice(index, 1);
      this.cdr.detectChanges();
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
      this.cdr.detectChanges();
      return;
    }

    if (validOptions.length < 2) {
      this.errorMessage = 'Please provide at least 2 non-empty options.';
      this.cdr.detectChanges();
      return;
    }

    this.submitting = true;
    this.cdr.detectChanges();

    const payload = {
      title: this.newTitle.trim(),
      description: this.newDescription.trim(),
      options: validOptions,
      startDate: this.newStartDate,
      endDate: this.newEndDate,
      targetVotes: this.newTargetVotes || 500
    };

    console.log('Creating poll with payload:', payload);

    this.http.post<any>('http://localhost:8080/api/polls', payload).pipe(
      catchError((err) => {
        console.error('Error creating poll:', err);
        if (err.status === 401 || err.status === 403) {
          this.errorMessage = 'Session expired or unauthorized. Please log in again.';
        } else {
          this.errorMessage = err?.error?.message || (typeof err?.error === 'string' ? err.error : null) || 'Failed to create and launch poll.';
        }
        this.cdr.detectChanges();
        return of(null);
      }),
      finalize(() => {
        this.submitting = false;
        this.cdr.detectChanges();
      })
    ).subscribe((res) => {
      if (res !== null) {
        this.successMessage = `Poll "${payload.title}" created successfully!`;
        this.closeModal();
        this.fetchPolls();
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
