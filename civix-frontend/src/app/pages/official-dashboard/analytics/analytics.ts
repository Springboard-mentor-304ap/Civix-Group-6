import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';

interface PollSummary {
  id: number;
  title: string;
  status: 'ACTIVE' | 'CLOSED';
  startDate: string;
  endDate: string;
  totalVotes: number;
  targetVotes: number;
  progressPct: number;
  leadingOption: string;
}

@Component({
  selector: 'app-official-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css'
})
export class OfficialAnalyticsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';

  // Summary Metrics
  totalPolls = 0;
  totalTargetGoal = 0;
  totalVotes = 0;
  overallCompletionPct = 0;

  // Status Breakdown Counts
  activeCount = 0;
  closedCount = 0;
  goalReachedCount = 0;

  // Status Percentages for Pie Chart
  activePercent = 0;
  closedPercent = 0;
  goalReachedPercent = 0;

  pieGradient = 'conic-gradient(#10b981 0% 33%, #2563eb 33% 66%, #f59e0b 66% 100%)';

  pollSummaries: PollSummary[] = [];

  ngOnInit() {
    this.fetchPollReports();
  }

  fetchPollReports() {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any[]>('http://localhost:8080/api/polls').pipe(
      catchError((err) => {
        console.error('Error fetching polls for official report:', err);
        this.errorMessage = 'Failed to load poll analytics data.';
        return of([]);
      }),
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe((data) => {
      const pollsList = data || [];
      this.totalPolls = pollsList.length;

      let sumVotes = 0;
      let sumTarget = 0;
      let activeC = 0;
      let closedC = 0;
      let goalMetC = 0;

      this.pollSummaries = pollsList.map(p => {
        const target = p.targetVotes || p.voteGoal || 500;
        sumTarget += target;

        let resultsObj: { [key: string]: number } = {};
        if (p.results && typeof p.results === 'object') {
          resultsObj = p.results;
        } else if (typeof p.results === 'string') {
          try { resultsObj = JSON.parse(p.results); } catch (e) {}
        }

        let pollVotesSum = 0;
        let highestOption = 'No votes yet';
        let maxVotes = -1;

        Object.entries(resultsObj).forEach(([opt, count]) => {
          const val = typeof count === 'number' ? count : 0;
          pollVotesSum += val;
          if (val > maxVotes) {
            maxVotes = val;
            highestOption = opt;
          }
        });

        if (maxVotes <= 0) {
          highestOption = 'Pending votes';
        }

        sumVotes += pollVotesSum;

        const isClosed = p.status === 'CLOSED';
        if (isClosed) {
          closedC++;
        } else {
          activeC++;
        }

        if (pollVotesSum >= target) {
          goalMetC++;
        }

        const pct = Math.min(100, Math.round((pollVotesSum / target) * 100));

        return {
          id: p.id,
          title: p.title || 'Untitled Poll',
          status: p.status || 'ACTIVE',
          startDate: p.startDate || new Date().toISOString(),
          endDate: p.endDate || new Date().toISOString(),
          totalVotes: pollVotesSum,
          targetVotes: target,
          progressPct: pct,
          leadingOption: highestOption
        };
      });

      this.totalVotes = sumVotes;
      this.totalTargetGoal = sumTarget > 0 ? sumTarget : 500;
      this.overallCompletionPct = Math.min(100, Math.round((this.totalVotes / this.totalTargetGoal) * 100));

      this.activeCount = activeC;
      this.closedCount = closedC;
      this.goalReachedCount = goalMetC;

      const totalP = this.totalPolls > 0 ? this.totalPolls : 1;
      this.activePercent = Math.round((this.activeCount / totalP) * 100);
      this.closedPercent = Math.round((this.closedCount / totalP) * 100);
      this.goalReachedPercent = Math.round((this.goalReachedCount / totalP) * 100);

      // Conic gradient calculation
      if (this.totalPolls === 0) {
        this.pieGradient = 'conic-gradient(#10b981 0% 33%, #2563eb 33% 66%, #f59e0b 66% 100%)';
      } else {
        const p1 = this.activePercent;
        const p2 = p1 + this.closedPercent;
        this.pieGradient = `conic-gradient(#10b981 0% ${p1}%, #2563eb ${p1}% ${p2}%, #f59e0b ${p2}% 100%)`;
      }

      this.cdr.detectChanges();
    });
  }
}
