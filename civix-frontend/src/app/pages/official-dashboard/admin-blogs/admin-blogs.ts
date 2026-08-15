import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface PetitionLog {
  id: number;
  title: string;
  description: string;
  creatorName?: string;
  category: string;
  location: string;
  status: string;
  currentSignatures: number;
  targetSignatures: number;
  createdAt: string;
  underReviewAt?: string;
  statusUpdatedAt?: string;
  officialResponse?: string;
}

@Component({
  selector: 'app-official-admin-blogs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-blogs.html',
  styleUrl: './admin-blogs.css'
})
export class OfficialAdminBlogsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';

  petitions: PetitionLog[] = [];

  // Monthly Report Summary Metrics
  currentMonthYear = '';
  generatedAt = new Date();
  totalPetitionsCount = 0;
  underReviewCount = 0;
  approvedCount = 0;
  activeCount = 0;
  rejectedCount = 0;
  totalSignaturesCount = 0;

  // Pie Chart Percentages & Conic Gradient
  approvedPct = 0;
  underReviewPct = 0;
  activePct = 0;
  rejectedPct = 0;
  pieGradient = 'conic-gradient(#10b981 0% 100%)';

  ngOnInit() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const d = new Date();
    this.currentMonthYear = `${months[d.getMonth()]} ${d.getFullYear()}`;
    this.fetchPetitionLogs();
  }

  fetchPetitionLogs() {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any[]>('http://localhost:8080/api/petitions').pipe(
      catchError((err) => {
        console.error('Error fetching petitions for admin logs:', err);
        this.errorMessage = 'Failed to load petition audit logs.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      const rawList = data || [];
      let underRev = 0;
      let appCount = 0;
      let actCount = 0;
      let rejCount = 0;
      let sigSum = 0;

      this.petitions = rawList.map(p => {
        const created = p.createdAt || p.createdDate || new Date().toISOString();
        const updated = p.updatedAt || p.statusUpdatedAt || created;
        const st = (p.status || 'ACTIVE').toUpperCase();
        const sigs = p.currentSignatures || p.signatureCount || 0;

        sigSum += sigs;
        if (st === 'UNDER_REVIEW' || st === 'PENDING') {
          underRev++;
        } else if (st === 'APPROVED' || st === 'RESOLVED') {
          appCount++;
        } else if (st === 'REJECTED') {
          rejCount++;
        } else {
          actCount++;
        }

        return {
          id: p.id,
          title: p.title || 'Untitled Petition',
          description: p.description || 'No description provided.',
          creatorName: p.creatorName || p.userName || 'Citizen User',
          category: p.category || 'General',
          location: p.location || 'Municipal Region',
          status: st,
          currentSignatures: sigs,
          targetSignatures: p.targetSignatures || 1000,
          createdAt: created,
          underReviewAt: p.underReviewAt || updated,
          statusUpdatedAt: updated,
          officialResponse: p.officialResponse || p.officerComment || ''
        };
      });

      this.totalPetitionsCount = this.petitions.length;
      this.underReviewCount = underRev;
      this.approvedCount = appCount;
      this.activeCount = actCount;
      this.rejectedCount = rejCount;
      this.totalSignaturesCount = sigSum;

      // Calculate Pie Chart Conic Gradient
      const total = this.totalPetitionsCount || 1;
      this.approvedPct = Math.round((appCount / total) * 100);
      this.underReviewPct = Math.round((underRev / total) * 100);
      this.activePct = Math.round((actCount / total) * 100);
      this.rejectedPct = Math.round((rejCount / total) * 100);

      const appDeg = (appCount / total) * 100;
      const revDeg = appDeg + (underRev / total) * 100;
      const actDeg = revDeg + (actCount / total) * 100;

      this.pieGradient = `conic-gradient(
        #10b981 0% ${appDeg}%,
        #f59e0b ${appDeg}% ${revDeg}%,
        #2563eb ${revDeg}% ${actDeg}%,
        #ef4444 ${actDeg}% 100%
      )`;

      this.cdr.detectChanges();
    });
  }

  exportToPdf() {
    this.generatedAt = new Date();
    window.print();
  }
}
