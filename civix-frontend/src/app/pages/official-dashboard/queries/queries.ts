import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

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

  queries: CitizenQuery[] = [];

  loading = false;
  submittingMap: { [id: number]: boolean } = {};
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.fetchQueries();
  }

  fetchQueries() {
    const userId = localStorage.getItem('id');
    if (!userId) {
      this.errorMessage = 'Session expired. Please log in again.';
      return;
    }

    this.errorMessage = '';
    this.loading = true;
    this.http.get<any[]>(`http://localhost:8080/api/queries?officialId=${userId}`).subscribe({
      next: (data) => {
        this.queries = data.map(q => ({
          id: q.id,
          citizenName: q.citizenName || 'Verified Citizen',
          citizenEmail: q.citizenEmail || 'citizen@email.com',
          message: q.message,
          status: q.status || 'PENDING',
          priority: q.priority || 'NORMAL',
          replyText: q.reply || '', // mapped from backend QueryResponse.reply
          submittedAt: q.submittedAt || new Date().toISOString()
        }));
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load citizen query tickets.';
        this.loading = false;
      }
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
      status: 'RESOLVED' // Auto resolve on replying
    };

    this.http.patch(`http://localhost:8080/api/queries/${query.id}/reply`, payload).subscribe({
      next: () => {
        query.status = 'RESOLVED';
        this.successMessage = `Reply successfully sent to ${query.citizenName}!`;
        this.submittingMap[query.id] = false;
      },
      error: (err) => {
        this.errorMessage = err?.error || 'Failed to submit response query.';
        this.submittingMap[query.id] = false;
      }
    });
  }

  toggleQueryStatus(query: CitizenQuery) {
    const newStatus = query.status === 'RESOLVED' ? 'PENDING' : 'RESOLVED';
    this.submittingMap[query.id] = true;
    const payload = { status: newStatus };

    this.http.patch(`http://localhost:8080/api/queries/${query.id}/reply`, payload).subscribe({
      next: () => {
        query.status = newStatus;
        this.successMessage = `Query status updated to ${newStatus}.`;
        this.submittingMap[query.id] = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to update ticket status.';
        this.submittingMap[query.id] = false;
      }
    });
  }
}
