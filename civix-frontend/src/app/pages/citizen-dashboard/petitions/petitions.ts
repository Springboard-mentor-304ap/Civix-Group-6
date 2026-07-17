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
  status: string;
  signedByMe?: boolean;
  officialResponse?: string;
}

@Component({
  selector: 'app-citizen-petitions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './petitions.html',
  styleUrl: './petitions.css'
})
export class CitizenPetitionsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  petitions: Petition[] = [];
  filteredPetitions: Petition[] = [];

  // Filter values
  selectedCategory = '';
  selectedLocation = '';

  // Form values for new petition
  showCreateModal = false;
  newTitle = '';
  newDescription = '';
  newCategory = 'Environment';
  newLocation = '';
  newTargetSignatures = 1000;

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  // Reference lists for filter menus
  categories = ['Environment', 'Infrastructure', 'Sanitation', 'Safety', 'Education'];
  locations = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];

  ngOnInit() {
    this.loadPetitions();
  }

  loadPetitions() {
    this.errorMessage = '';
    this.loading = true;
    this.http.get<Petition[]>('http://localhost:8080/api/petitions').subscribe({
      next: (data) => {
        try {
          this.petitions = data || [];
          this.applyFilters();
        } catch (e) {
          console.error('Error processing fetched petitions:', e);
        } finally {
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error fetching petitions:', err);
        this.errorMessage = 'Failed to load petitions from the server.';
        this.loading = false;
      }
    });
  }

  applyFilters() {
    this.filteredPetitions = this.petitions.filter(p => {
      const matchCat = !this.selectedCategory || p.category?.toLowerCase() === this.selectedCategory.toLowerCase();
      const matchLoc = !this.selectedLocation || (p.location || '').toLowerCase().includes(this.selectedLocation.toLowerCase());
      return matchCat && matchLoc;
    });
  }

  signPetition(petition: Petition) {
    this.errorMessage = '';
    this.successMessage = '';
    
    this.http.post(`http://localhost:8080/api/petitions/${petition.id}/sign`, {}).subscribe({
      next: () => {
        petition.currentSignatures++;
        petition.signedByMe = true;
        this.successMessage = `Successfully signed: "${petition.title}"!`;
        this.applyFilters();
      },
      error: (err) => {
        this.errorMessage = err?.error || 'Failed to sign the petition. Try again later.';
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
    this.newCategory = 'Environment';
    this.newLocation = '';
    this.newTargetSignatures = 1000;
  }

  onCreatePetition() {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.newTitle.trim() || !this.newDescription.trim() || !this.newLocation.trim()) {
      this.errorMessage = 'Please fill out all required fields.';
      return;
    }

    this.submitting = true;
    const payload = {
      title: this.newTitle.trim(),
      description: this.newDescription.trim(),
      category: this.newCategory,
      location: this.newLocation.trim(),
      targetSignatures: this.newTargetSignatures
    };

    this.http.post<Petition>('http://localhost:8080/api/petitions', payload).subscribe({
      next: (res) => {
        console.log('Successfully created petition:', res);
        this.successMessage = `Petition "${payload.title}" created successfully!`;
        this.closeModal();
        this.loadPetitions();
        this.submitting = false;
      },
      error: (err) => {
        console.error('Error creating petition:', err);
        this.errorMessage = 'Failed to create new petition.';
        this.submitting = false;
      }
    });
  }
}
