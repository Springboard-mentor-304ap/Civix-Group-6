import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
  officialResponse?: string;
  assignedDepartment?: string;
  priority?: string;
  internalNotes?: string;
  createdAt?: string;
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
  private readonly cdr = inject(ChangeDetectorRef);

  petitions: Petition[] = [];
  filteredPetitions: Petition[] = [];
  location = localStorage.getItem('city') || '';

  // Filter state
  searchText = '';
  selectedStatus = 'All';
  selectedDepartment = 'All';
  selectedPriority = 'All';
  selectedCategory = 'All';
  startDateFilter = '';
  endDateFilter = '';

  // Timeline modal state
  showTimelineModal = false;
  selectedTimelinePetition: Petition | null = null;
  timelineEvents: any[] = [];
  timelineLoading = false;

  // Bulk action selection
  selectedIds = new Set<number>();

  loading = false;
  submittingMap: { [id: number]: boolean } = {};
  notesMap: { [id: number]: string } = {};
  errorMessage = '';
  successMessage = '';

  // Options for petition statuses, departments, priorities
  statusOptions = ['ACTIVE', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'RESOLVED', 'CLOSED'];
  departments = [
    'Roads Department', 'Water Department', 'Electricity Department',
    'Sanitation', 'Parks', 'Public Safety', 'Transport', 'Housing',
    'Education', 'Healthcare'
  ];
  priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  categories = ['All', 'Environment', 'Infrastructure', 'Sanitation', 'Safety', 'Education'];

  // Dashboard Stats
  pendingReviewCount = 0;
  underReviewCount = 0;
  approvedCount = 0;
  rejectedCount = 0;
  criticalCount = 0;
  totalCount = 0;

  ngOnInit() {
    this.fetchPetitions();
  }

  fetchPetitions() {
    this.errorMessage = '';
    this.loading = true;
    const url = `http://localhost:8080/api/petitions${this.location ? '?location=' + this.location : ''}`;
    
    this.http.get<Petition[]>(url)
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
          this.calculateStats();
          this.applyFilters();
        },
        error: () => {
          this.errorMessage = 'Failed to load petitions for your municipality.';
        }
      });
  }

  calculateStats() {
    this.totalCount = this.petitions.length;
    this.pendingReviewCount = this.petitions.filter(p => (p.status || '').toUpperCase() === 'ACTIVE').length;
    this.underReviewCount = this.petitions.filter(p => (p.status || '').toUpperCase() === 'UNDER_REVIEW').length;
    this.approvedCount = this.petitions.filter(p => (p.status || '').toUpperCase() === 'APPROVED').length;
    this.rejectedCount = this.petitions.filter(p => (p.status || '').toUpperCase() === 'REJECTED').length;
    this.criticalCount = this.petitions.filter(p => (p.priority || '').toUpperCase() === 'CRITICAL').length;
  }

  applyFilters() {
    let list = this.petitions.filter(p => {
      // Text Search (Title, Description, Creator Name, or ID)
      if (this.searchText.trim()) {
        const q = this.searchText.toLowerCase().trim();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchDesc = (p.description || '').toLowerCase().includes(q);
        const matchCreator = (p.creatorName || '').toLowerCase().includes(q);
        const matchId = String(p.id) === q;
        if (!matchTitle && !matchDesc && !matchCreator && !matchId) return false;
      }

      // Status
      if (this.selectedStatus !== 'All' && (p.status || '').toUpperCase() !== this.selectedStatus.toUpperCase()) {
        return false;
      }

      // Department
      if (this.selectedDepartment !== 'All' && (p.assignedDepartment || '').toLowerCase() !== this.selectedDepartment.toLowerCase()) {
        return false;
      }

      // Priority
      if (this.selectedPriority !== 'All' && (p.priority || 'MEDIUM').toUpperCase() !== this.selectedPriority.toUpperCase()) {
        return false;
      }

      // Category
      if (this.selectedCategory !== 'All' && (p.category || '').toLowerCase() !== this.selectedCategory.toLowerCase()) {
        return false;
      }

      // Date Range Filters
      if (this.startDateFilter && p.createdAt) {
        const pDate = p.createdAt.split('T')[0];
        if (pDate < this.startDateFilter) return false;
      }
      if (this.endDateFilter && p.createdAt) {
        const pDate = p.createdAt.split('T')[0];
        if (pDate > this.endDateFilter) return false;
      }

      return true;
    });

    this.filteredPetitions = list;
    this.cdr.detectChanges();
  }

  // Bulk Actions Selection
  isAllSelected(): boolean {
    return this.filteredPetitions.length > 0 && this.filteredPetitions.every(p => this.selectedIds.has(p.id));
  }

  toggleSelectAll(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.filteredPetitions.forEach(p => this.selectedIds.add(p.id));
    } else {
      this.selectedIds.clear();
    }
  }

  toggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  bulkUpdateStatus(newStatus: string) {
    if (this.selectedIds.size === 0) return;
    this.errorMessage = '';
    this.successMessage = '';

    const ids = Array.from(this.selectedIds);
    let completed = 0;

    ids.forEach(id => {
      const pet = this.petitions.find(p => p.id === id);
      if (pet) {
        const payload = {
          status: newStatus,
          reply: pet.officialResponse || '',
          department: pet.assignedDepartment || '',
          priority: pet.priority || 'MEDIUM',
          internalNotes: pet.internalNotes || ''
        };
        this.http.patch(`http://localhost:8080/api/petitions/${id}/status`, payload).subscribe({
          next: () => {
            pet.status = newStatus;
            completed++;
            if (completed === ids.length) {
              this.successMessage = `Bulk updated ${completed} petitions to ${newStatus.replace('_', ' ')}!`;
              this.selectedIds.clear();
              this.calculateStats();
              this.applyFilters();
              this.cdr.detectChanges();
            }
          }
        });
      }
    });
  }

  // Action Handlers
  updatePetitionField(petition: Petition, fieldUpdates: { status?: string; reply?: string; department?: string; priority?: string; internalNotes?: string }) {
    this.errorMessage = '';
    this.successMessage = '';
    this.submittingMap[petition.id] = true;

    const payload = {
      status: fieldUpdates.status || petition.status,
      reply: fieldUpdates.reply !== undefined ? fieldUpdates.reply : (petition.officialResponse || ''),
      department: fieldUpdates.department !== undefined ? fieldUpdates.department : (petition.assignedDepartment || ''),
      priority: fieldUpdates.priority !== undefined ? fieldUpdates.priority : (petition.priority || 'MEDIUM'),
      internalNotes: fieldUpdates.internalNotes !== undefined ? fieldUpdates.internalNotes : (petition.internalNotes || '')
    };

    this.http.patch<any>(`http://localhost:8080/api/petitions/${petition.id}/status`, payload).subscribe({
      next: (res) => {
        // Backend returns { success: true }. We update local model from payload values to ensure UI sync.
        petition.status = payload.status;
        petition.officialResponse = payload.reply;
        petition.assignedDepartment = payload.department;
        petition.priority = payload.priority;
        petition.internalNotes = payload.internalNotes;

        this.successMessage = `Petition "${petition.title}" updated successfully!`;
        this.submittingMap[petition.id] = false;
        this.calculateStats();
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error || 'Failed to update petition status.';
        this.submittingMap[petition.id] = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Timeline Modal Handlers
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


  changeStatus(petition: Petition, newStatus: string) {
    this.updatePetitionField(petition, { status: newStatus });
  }

  assignDepartment(petition: Petition, event: Event) {
    const select = event.target as HTMLSelectElement;
    this.updatePetitionField(petition, { department: select.value });
  }

  changePriority(petition: Petition, event: Event) {
    const select = event.target as HTMLSelectElement;
    this.updatePetitionField(petition, { priority: select.value });
  }

  saveInternalNotes(petition: Petition) {
    const notes = this.notesMap[petition.id];
    if (notes === undefined) return;
    this.updatePetitionField(petition, { internalNotes: notes });
  }

  getProgressPercent(petition: Petition): number {
    const target = petition.targetSignatures || 100;
    const current = petition.currentSignatures || 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  deletePetition(petition: Petition) {
    if (!confirm(`Are you sure you want to delete petition "${petition.title}"?`)) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.http.delete(`http://localhost:8080/api/petitions/${petition.id}`).subscribe({
      next: () => {
        this.petitions = this.petitions.filter(p => p.id !== petition.id);
        this.successMessage = `Petition "${petition.title}" deleted successfully.`;
        this.calculateStats();
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || err?.error || 'Failed to delete petition.';
        this.cdr.detectChanges();
      }
    });
  }
}
