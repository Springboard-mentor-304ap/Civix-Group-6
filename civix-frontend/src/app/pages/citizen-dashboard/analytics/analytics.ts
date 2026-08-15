import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

interface Petition {
  id: number;
  title: string;
  status: string;
  currentSignatures?: number;
  signatureCount?: number;
}

interface Poll {
  id: number;
  title: string;
  results?: { [key: string]: number } | string;
}

@Component({
  selector: 'app-citizen-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class CitizenAnalyticsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';

  // KPI Metrics
  totalPetitions = 0;
  totalPolls = 0;
  totalSignatures = 0;
  totalVotes = 0;

  // 4 Petition Status Breakdown Counts
  approvedCount = 0;
  underReviewCount = 0;
  resolvedCount = 0;
  rejectedCount = 0;

  // Status Percentages for Pie Chart
  approvedPercent = 0;
  underReviewPercent = 0;
  resolvedPercent = 0;
  rejectedPercent = 0;

  // Conic gradient CSS string for pie chart
  pieGradient = 'conic-gradient(#10b981 0% 25%, #f59e0b 25% 50%, #2563eb 50% 75%, #ef4444 75% 100%)';

  ngOnInit() {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      petitions: this.http.get<any[]>('http://localhost:8080/api/petitions').pipe(
        catchError((err) => {
          console.error('Error fetching petitions for report:', err);
          return of([]);
        })
      ),
      polls: this.http.get<any[]>('http://localhost:8080/api/polls').pipe(
        catchError((err) => {
          console.error('Error fetching polls for report:', err);
          return of([]);
        })
      )
    }).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe(({ petitions, polls }) => {
      this.totalPetitions = petitions ? petitions.length : 0;
      this.totalPolls = polls ? polls.length : 0;

      // Calculate total signatures
      let signaturesSum = 0;
      let approvedC = 0;
      let underReviewC = 0;
      let resolvedC = 0;
      let rejectedC = 0;

      petitions.forEach(p => {
        const sigs = p.currentSignatures || p.signatureCount || 0;
        signaturesSum += sigs;

        const st = (p.status || 'ACTIVE').toUpperCase();
        if (st === 'APPROVED' || st === 'ACTIVE') {
          approvedC++;
        } else if (st === 'UNDER_REVIEW' || st === 'PENDING' || st === 'IN_REVIEW') {
          underReviewC++;
        } else if (st === 'RESOLVED' || st === 'CLOSED' || st === 'COMPLETED') {
          resolvedC++;
        } else if (st === 'REJECTED' || st === 'DECLINED') {
          rejectedC++;
        } else {
          approvedC++;
        }
      });

      this.totalSignatures = signaturesSum;
      this.approvedCount = approvedC;
      this.underReviewCount = underReviewC;
      this.resolvedCount = resolvedC;
      this.rejectedCount = rejectedC;

      // Calculate total votes across polls
      let votesSum = 0;
      polls.forEach(p => {
        let resultsObj: { [key: string]: number } = {};
        if (p.results && typeof p.results === 'object') {
          resultsObj = p.results;
        } else if (typeof p.results === 'string') {
          try { resultsObj = JSON.parse(p.results); } catch (e) {}
        }
        Object.values(resultsObj).forEach(val => {
          if (typeof val === 'number') {
            votesSum += val;
          }
        });
      });
      this.totalVotes = votesSum;

      // Compute percentages for Pie Chart
      const totalP = this.totalPetitions > 0 ? this.totalPetitions : 1;
      this.approvedPercent = Math.round((this.approvedCount / totalP) * 100);
      this.underReviewPercent = Math.round((this.underReviewCount / totalP) * 100);
      this.resolvedPercent = Math.round((this.resolvedCount / totalP) * 100);
      this.rejectedPercent = Math.round((this.rejectedCount / totalP) * 100);

      // Build conic-gradient for CSS pie chart
      if (this.totalPetitions === 0) {
        this.pieGradient = 'conic-gradient(#10b981 0% 25%, #f59e0b 25% 50%, #2563eb 50% 75%, #ef4444 75% 100%)';
      } else {
        const p1 = this.approvedPercent;
        const p2 = p1 + this.underReviewPercent;
        const p3 = p2 + this.resolvedPercent;
        this.pieGradient = `conic-gradient(#10b981 0% ${p1}%, #f59e0b ${p1}% ${p2}%, #2563eb ${p2}% ${p3}%, #ef4444 ${p3}% 100%)`;
      }

      this.cdr.detectChanges();
    });
  }
}
