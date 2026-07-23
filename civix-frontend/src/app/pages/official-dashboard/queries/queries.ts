import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

interface CitizenQuery {
  id: number;
  citizenName: string;
  citizenEmail: string;
  message: string;
  status: 'PENDING' | 'RESOLVED';
  priority: 'NORMAL' | 'URGENT';
  replyText?: string;
  submittedAt: string;
}

@Component({
  selector: 'app-official-queries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './queries.html',
  styleUrl: './queries.css'
})
export class OfficialQueriesComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  queries: CitizenQuery[] = [];

  loading = false;
  submittingMap: { [id: number]: boolean } = {};
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.fetchQueries();
  }

  fetchQueries() {
    const userId = localStorage.getItem('id') ?? localStorage.getItem('userId');
    if (!userId) {
      console.warn('Official session not found in Queries. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.errorMessage = '';
    console.log('[Queries] Loading state before request:', this.loading);
    this.loading = true;
    this.cdr.detectChanges();

    console.log(`[Queries] Request sent for officialId: ${userId}`);

    this.http.get<any[]>(`http://localhost:8080/api/queries?officialId=${userId}`).pipe(
      catchError((err) => {
        console.error('[Queries] Error fetching queries:', err);
        this.errorMessage = 'Failed to load citizen query tickets.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        console.log('[Queries] Loading state after finalize:', this.loading);
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      console.log('[Queries] Response received:', data);
      const rawQueries = data || [];
      console.log('[Queries] Array length:', rawQueries.length);
      this.queries = rawQueries.map(q => ({
        id: q.id,
        citizenName: q.citizenName || 'Verified Citizen',
        citizenEmail: q.citizenEmail || 'citizen@email.com',
        message: q.message || '',
        status: q.status || 'PENDING',
        priority: q.priority || 'NORMAL',
        replyText: q.reply || '',
        submittedAt: q.submittedAt || new Date().toISOString()
      }));
      this.loading = false;
      console.log('[Queries] Template collection length (queries.length):', this.queries.length);
      this.cdr.detectChanges();
    });
  }

  submitReply(query: CitizenQuery) {
    this.errorMessage = '';
    this.successMessage = '';

    if (!query.replyText?.trim()) {
      this.errorMessage = 'Please type a reply message first.';
      return;
    }

    this.submittingMap[query.id] = true;
    const payload = {
      reply: query.replyText.trim(),
      status: 'RESOLVED'
    };

    console.log(`Submitting reply for query ${query.id}:`, payload);

    this.http.patch(`http://localhost:8080/api/queries/${query.id}/reply`, payload).pipe(
      catchError((err) => {
        console.error(`Error submitting reply for query ${query.id}:`, err);
        this.errorMessage = err?.error || 'Failed to submit response query.';
        return of(null);
      }),
      finalize(() => {
        this.submittingMap[query.id] = false;
      })
    ).subscribe((res) => {
      if (res !== null) {
        query.status = 'RESOLVED';
        this.successMessage = `Reply successfully sent to ${query.citizenName}!`;
      }
    });
  }

  toggleQueryStatus(query: CitizenQuery) {
    const newStatus = query.status === 'RESOLVED' ? 'PENDING' : 'RESOLVED';
    this.submittingMap[query.id] = true;
    const payload = { status: newStatus };

    console.log(`Toggling query ${query.id} status to ${newStatus}`);

    this.http.patch(`http://localhost:8080/api/queries/${query.id}/reply`, payload).pipe(
      catchError((err) => {
        console.error(`Error toggling query ${query.id} status:`, err);
        this.errorMessage = 'Failed to update ticket status.';
        return of(null);
      }),
      finalize(() => {
        this.submittingMap[query.id] = false;
      })
    ).subscribe((res) => {
      if (res !== null) {
        query.status = newStatus;
        this.successMessage = `Query status updated to ${newStatus}.`;
      }
    });
  }
}
