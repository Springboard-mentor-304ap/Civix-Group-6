import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { catchError, of, finalize } from 'rxjs';

interface Petition {
  id: number;
  creatorId?: number;
  creatorName?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  targetSignatures: number;
  currentSignatures: number;
  status: string;
  signedByMe?: boolean;
  officialResponse?: string;
  createdAt?: string;
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);

  petitions: Petition[] = [];
  filteredPetitions: Petition[] = [];
  paginatedPetitions: Petition[] = [];

  // Tab state: 'ALL' | 'MY' | 'SIGNED'
  activeTab: 'ALL' | 'MY' | 'SIGNED' = 'ALL';

  // Search and Filter state
  searchText = '';
  selectedCategory = 'All';
  selectedStatus = 'All';
  selectedLocation = 'All';
  selectedSort = 'RECENT'; // 'RECENT' | 'MOST_SIGNED' | 'PROGRESS'

  // Pagination state
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;

  // Form values for new petition
  showCreateModal = false;
  newTitle = '';
  newDescription = '';
  newCategory = 'Environment';
  newLocation = '';
  newTargetSignatures = 100;

  // Edit petition modal state
  showEditModal = false;
  editingPetition: Petition | null = null;
  editTitle = '';
  editDescription = '';
  editCategory = 'Environment';
  editLocation = '';
  editTargetSignatures = 100;

  // Timeline modal state
  showTimelineModal = false;
  selectedTimelinePetition: Petition | null = null;
  timelineEvents: any[] = [];
  timelineLoading = false;

  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';

  // Reference lists
  categories = ['All', 'Environment', 'Infrastructure', 'Sanitation', 'Safety', 'Education'];
  statuses = ['All', 'ACTIVE', 'UNDER_REVIEW', 'CLOSED', 'APPROVED', 'REJECTED', 'RESOLVED'];
  locations = ['All', 'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata'];

  get currentUserId(): number {
    return Number(localStorage.getItem('id') || localStorage.getItem('userId') || '0');
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['tab']) {
        const tabParam = params['tab'].toUpperCase();
        if (tabParam === 'MY' || tabParam === 'SIGNED' || tabParam === 'ALL') {
          this.activeTab = tabParam as 'ALL' | 'MY' | 'SIGNED';
        }
      }
    });
    this.loadPetitions();
  }

  loadPetitions() {
    this.errorMessage = '';
    this.loading = true;
    this.http.get<Petition[]>('http://localhost:8080/api/petitions')
      .pipe(
        catchError(() => of([])),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.petitions = data || [];
          this.applyFilters();
        },
        error: () => {
          this.petitions = [];
          this.errorMessage = 'Failed to load petitions.';
        }
      });
  }

  setTab(tab: 'ALL' | 'MY' | 'SIGNED') {
    this.activeTab = tab;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    const userId = this.currentUserId;

    let result = this.petitions.filter(p => {
      // Tab filter
      if (this.activeTab === 'MY' && p.creatorId !== userId) return false;
      if (this.activeTab === 'SIGNED' && !p.signedByMe) return false;

      // Text Search
      if (this.searchText.trim()) {
        const query = this.searchText.toLowerCase().trim();
        const matchTitle = (p.title || '').toLowerCase().includes(query);
        const matchDesc = (p.description || '').toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      // Category filter
      if (this.selectedCategory !== 'All' && (p.category || '').toLowerCase() !== this.selectedCategory.toLowerCase()) {
        return false;
      }

      // Status filter
      if (this.selectedStatus !== 'All' && (p.status || '').toUpperCase() !== this.selectedStatus.toUpperCase()) {
        return false;
      }

      // Location filter
      if (this.selectedLocation !== 'All' && !(p.location || '').toLowerCase().includes(this.selectedLocation.toLowerCase())) {
        return false;
      }

      return true;
    });

    // Sorting
    if (this.selectedSort === 'MOST_SIGNED') {
      result.sort((a, b) => (b.currentSignatures || 0) - (a.currentSignatures || 0));
    } else if (this.selectedSort === 'PROGRESS') {
      result.sort((a, b) => this.getProgressPercent(b) - this.getProgressPercent(a));
    } else {
      // RECENT default
      result.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    this.filteredPetitions = result;
    this.totalPages = Math.ceil(this.filteredPetitions.length / this.pageSize) || 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedPetitions = this.filteredPetitions.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  getProgressPercent(petition: Petition): number {
    const target = petition.targetSignatures || 100;
    const current = petition.currentSignatures || 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  isOwner(petition: Petition): boolean {
    return !!petition.creatorId && petition.creatorId === this.currentUserId;
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
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error || 'Failed to sign the petition. Try again later.';
        this.cdr.detectChanges();
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
    this.newTargetSignatures = 100;
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
      targetSignatures: this.newTargetSignatures || 100
    };

    this.http.post<Petition>('http://localhost:8080/api/petitions', payload).subscribe({
      next: () => {
        this.successMessage = `Petition "${payload.title}" created successfully!`;
        this.closeModal();
        this.loadPetitions();
        this.submitting = false;
      },
      error: () => {
        this.errorMessage = 'Failed to create new petition.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  openEditModal(petition: Petition) {
    this.editingPetition = petition;
    this.editTitle = petition.title;
    this.editDescription = petition.description;
    this.editCategory = petition.category || 'Environment';
    this.editLocation = petition.location || '';
    this.editTargetSignatures = petition.targetSignatures || 100;
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingPetition = null;
  }

  onUpdatePetition() {
    if (!this.editingPetition) return;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.editTitle.trim() || !this.editDescription.trim() || !this.editLocation.trim()) {
      this.errorMessage = 'Please fill out all required fields for update.';
      return;
    }

    this.submitting = true;
    const payload = {
      title: this.editTitle.trim(),
      description: this.editDescription.trim(),
      category: this.editCategory,
      location: this.editLocation.trim(),
      targetSignatures: this.editTargetSignatures || 100
    };

    this.http.put<Petition>(`http://localhost:8080/api/petitions/${this.editingPetition.id}`, payload).subscribe({
      next: (res) => {
        this.successMessage = `Petition "${payload.title}" updated successfully!`;
        this.closeEditModal();
        this.loadPetitions();
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error || 'Failed to update petition.';
        this.submitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDeletePetition(petition: Petition) {
    if (!confirm(`Are you sure you want to delete petition "${petition.title}"?`)) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.http.delete(`http://localhost:8080/api/petitions/${petition.id}`).subscribe({
      next: () => {
        // 1. Remove card from local arrays immediately for instant feedback
        this.petitions = this.petitions.filter(p => p.id !== petition.id);
        this.applyFilters();

        // 2. Set success message and trigger change detection
        this.successMessage = `Petition "${petition.title}" was deleted successfully.`;
        this.cdr.detectChanges();

        // 3. Refresh list from backend to maintain full sync
        this.loadPetitions();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error || 'Failed to delete petition. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  openTimelineModal(petition: Petition) {
    this.selectedTimelinePetition = petition;
    this.showTimelineModal = true;
    this.timelineLoading = true;
    this.timelineEvents = [];
    this.http.get<any[]>(`http://localhost:8080/api/petitions/${petition.id}/timeline`).subscribe({
      next: (data) => {
        this.timelineEvents = data || [];
        this.timelineLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.timelineLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeTimelineModal() {
    this.showTimelineModal = false;
    this.selectedTimelinePetition = null;
    this.timelineEvents = [];
  }
}
