import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface MonthlyReport {
  month: string;
  totalPetitions: number;
  resolved: number;
  pending: number;
  rejected: number;
  resolutionRate: number;
  averageResolutionTime: number;
  mostActiveLocality: string;
  mostActiveCategory: string;
  totalCitizensParticipated: number;
  topTrendingIssues: string[];
  monthlyGrowthPercentage: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private readonly http = inject(HttpClient);

  getMonthlyReport(month: number, year: number): Observable<MonthlyReport> {
    return this.http.get<MonthlyReport>(`http://localhost:8080/api/reports/monthly?month=${month}&year=${year}`);
  }

  downloadPdf(month: number, year: number): Observable<Blob> {
    return this.http.get(`http://localhost:8080/api/reports/export/pdf?month=${month}&year=${year}`, {
      responseType: 'blob'
    });
  }

  downloadCsv(month: number, year: number): Observable<Blob> {
    return this.http.get(`http://localhost:8080/api/reports/export/csv?month=${month}&year=${year}`, {
      responseType: 'blob'
    });
  }
}
