import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface Petition {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  targetSignatures: number;
  currentSignatures: number;
  status: 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'RESOLVED' | 'ACTIVE' | 'CLOSED';
  officialResponse?: string;
  creatorName?: string;
}

@Component({
  selector: 'app-official-petitions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './petitions.html',
  styleUrl: './petitions.css'
})
export class OfficialPetitionsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  petitions: Petition[] = [];
  location = localStorage.getItem('city') || 'Delhi';

  loading = false;
  submittingMap: { [id: number]: boolean } = {};
  errorMessage = '';
  successMessage = '';

  // Options for petition statuses
  statusOptions = ['ACTIVE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED', 'CLOSED'];

  ngOnInit() {
    this.fetchPetitions();
  }

  fetchPetitions() {
    this.errorMessage = '';
    this.loading = true;
    this.http.get<Petition[]>(`http://localhost:8080/api/petitions?location=${this.location}`).subscribe({
      next: (data) => {
        this.petitions = data || [];
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load petitions for your municipality.';
        this.loading = false;
      }
    });
  }

  updatePetitionStatus(petition: Petition) {
    this.errorMessage = '';
    this.successMessage = '';
    this.submittingMap[petition.id] = true;

    const payload = {
      status: petition.status,
      reply: petition.officialResponse?.trim() || '' // maps to ReplyRequest.reply in backend
    };

    this.http.patch(`http://localhost:8080/api/petitions/${petition.id}/status`, payload).subscribe({
      next: () => {
        this.successMessage = `Petition "${petition.title}" updated successfully!`;
        this.submittingMap[petition.id] = false;
      },
      error: (err) => {
        this.errorMessage = err?.error || 'Failed to update petition status. Try again later.';
        this.submittingMap[petition.id] = false;
      }
    });
  }
}
