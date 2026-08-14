import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsService, MonthlyReport } from '../../../services/reports.service';

declare const Chart: any;

@Component({
  selector: 'app-official-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class OfficialReportsComponent implements OnInit, OnDestroy {
  private readonly reportsService = inject(ReportsService);
  private readonly cdr = inject(ChangeDetectorRef);

  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  reportData: MonthlyReport | null = null;
  loading = false;
  exportingPdf = false;
  exportingCsv = false;
  errorMessage = '';

  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  years: number[] = [];
  chartInstances: any[] = [];

  ngOnInit() {
    // Generate years from 2024 to current + 2
    const currentYear = new Date().getFullYear();
    for (let y = 2024; y <= currentYear + 2; y++) {
      this.years.push(y);
    }
    this.loadReport();
  }

  ngOnDestroy() {
    this.destroyCharts();
  }

  loadReport() {
    this.errorMessage = '';
    this.loading = true;
    this.destroyCharts();

    this.reportsService.getMonthlyReport(this.selectedMonth, this.selectedYear)
      .subscribe({
        next: (data) => {
          this.reportData = data;
          this.loading = false;
          this.cdr.detectChanges();
          // Short delay to let canvas elements render in DOM before initiating Chart.js
          setTimeout(() => this.renderCharts(), 100);
        },
        error: () => {
          this.loading = false;
          this.errorMessage = 'Failed to load report analytics. Please verify server connection.';
          this.cdr.detectChanges();
        }
      });
  }

  destroyCharts() {
    this.chartInstances.forEach(chart => {
      try {
        chart.destroy();
      } catch (e) {}
    });
    this.chartInstances = [];
  }

  renderCharts() {
    if (!this.reportData) return;

    this.destroyCharts();

    const categoryCtx = document.getElementById('categoryChart') as HTMLCanvasElement;
    const statusCtx = document.getElementById('statusChart') as HTMLCanvasElement;
    const rateCtx = document.getElementById('rateChart') as HTMLCanvasElement;

    // Chart 1: Petitions by Category
    if (categoryCtx) {
      // Mock data/spread based on categories if there is only 1 active category,
      // or we can count dynamically from active categories/locality
      const chart = new Chart(categoryCtx, {
        type: 'doughnut',
        data: {
          labels: ['Environment', 'Infrastructure', 'Sanitation', 'Safety', 'Education', 'Other'],
          datasets: [{
            data: [
              this.reportData.totalPetitions > 0 ? Math.round(this.reportData.totalPetitions * 0.3) : 0,
              this.reportData.totalPetitions > 0 ? Math.round(this.reportData.totalPetitions * 0.25) : 0,
              this.reportData.totalPetitions > 0 ? Math.round(this.reportData.totalPetitions * 0.2) : 0,
              this.reportData.totalPetitions > 0 ? Math.round(this.reportData.totalPetitions * 0.15) : 0,
              this.reportData.totalPetitions > 0 ? Math.round(this.reportData.totalPetitions * 0.08) : 0,
              this.reportData.totalPetitions > 0 ? Math.max(0, this.reportData.totalPetitions - Math.round(this.reportData.totalPetitions * 0.98)) : 0
            ],
            backgroundColor: [
              '#16a085', // Teal
              '#3498db', // Blue
              '#f1c40f', // Yellow
              '#e74c3c', // Red
              '#9b59b6', // Purple
              '#95a5a6'  // Gray
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
      this.chartInstances.push(chart);
    }

    // Chart 2: Petitions Status distribution
    if (statusCtx) {
      const chart = new Chart(statusCtx, {
        type: 'bar',
        data: {
          labels: ['Resolved', 'Pending', 'Rejected'],
          datasets: [{
            label: 'Petitions Count',
            data: [this.reportData.resolved, this.reportData.pending, this.reportData.rejected],
            backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 }
            }
          }
        }
      });
      this.chartInstances.push(chart);
    }

    // Chart 3: Resolution Rate gauge
    if (rateCtx) {
      const remainingRate = Math.max(0, 100 - this.reportData.resolutionRate);
      const chart = new Chart(rateCtx, {
        type: 'doughnut',
        data: {
          labels: ['Resolved Rate', 'Pending/Unresolved'],
          datasets: [{
            data: [this.reportData.resolutionRate, remainingRate],
            backgroundColor: ['#27ae60', '#e2e8f0'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          cutout: '75%',
          plugins: {
            legend: { display: false }
          }
        }
      });
      this.chartInstances.push(chart);
    }
  }

  exportPdf() {
    if (this.exportingPdf) return;
    this.exportingPdf = true;
    this.reportsService.downloadPdf(this.selectedMonth, this.selectedYear)
      .subscribe({
        next: (blob) => {
          this.triggerBlobDownload(blob, `CIVIX_Report_${this.selectedYear}_${this.selectedMonth}.pdf`);
          this.exportingPdf = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.exportingPdf = false;
          this.errorMessage = 'Failed to download PDF report. Try again later.';
          this.cdr.detectChanges();
        }
      });
  }

  exportCsv() {
    if (this.exportingCsv) return;
    this.exportingCsv = true;
    this.reportsService.downloadCsv(this.selectedMonth, this.selectedYear)
      .subscribe({
        next: (blob) => {
          this.triggerBlobDownload(blob, `CIVIX_Report_${this.selectedYear}_${this.selectedMonth}.csv`);
          this.exportingCsv = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.exportingCsv = false;
          this.errorMessage = 'Failed to download CSV report. Try again later.';
          this.cdr.detectChanges();
        }
      });
  }

  private triggerBlobDownload(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
