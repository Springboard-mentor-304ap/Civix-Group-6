import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface Official {
  id: number;
  name: string;
  email: string;
  city: string;
  state: string;
  role: string;
}

@Component({
  selector: 'app-citizen-officials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './officials.html',
  styleUrl: './officials.css'
})
export class CitizenOfficialsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  officials: Official[] = [];
  filteredOfficials: Official[] = [];

  searchText = '';

  // Message modal state
  selectedOfficial: Official | null = null;
  messageText = '';
  priorityValue = 'NORMAL';
  showModal = false;

  loading = false;
  submitting = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit() {
    this.fetchOfficials();
  }

  fetchOfficials() {
    this.errorMessage = '';
    this.loading = true;
    this.http.get<Official[]>('http://localhost:8080/api/users?role=OFFICIAL').subscribe({
      next: (data) => {
        this.officials = data || [];
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load verified public officials.';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    if (!this.searchText.trim()) {
      this.filteredOfficials = this.officials;
      return;
    }
    const query = this.searchText.toLowerCase().trim();
    this.filteredOfficials = this.officials.filter(o => 
      o.name.toLowerCase().includes(query) || 
      (o.city && o.city.toLowerCase().includes(query)) || 
      (o.state && o.state.toLowerCase().includes(query))
    );
  }

  openMessageModal(official: Official) {
    this.selectedOfficial = official;
    this.messageText = '';
    this.priorityValue = 'NORMAL';
    this.showModal = true;
  }

  closeMessageModal() {
    this.showModal = false;
    this.selectedOfficial = null;
    this.messageText = '';
  }

  sendMessage() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.messageText.trim()) {
      this.errorMessage = 'Please type a message before sending.';
      return;
    }

    if (!this.selectedOfficial) return;

    this.submitting = true;
    const payload = {
      officialId: this.selectedOfficial.id,
      message: this.messageText.trim(),
      priority: this.priorityValue
    };

    // Store in query table
    this.http.post('http://localhost:8080/api/queries', payload).subscribe({
      next: (res) => {
        this.successMessage = `Your message has been successfully sent to ${this.selectedOfficial?.name}!`;
        this.closeMessageModal();
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to send query. Try again later.';
        this.submitting = false;
      }
    });
  }
}
