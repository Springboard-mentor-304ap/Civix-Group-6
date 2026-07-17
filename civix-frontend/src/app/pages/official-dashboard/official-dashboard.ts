import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-official-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './official-dashboard.html',
  styleUrl: './official-dashboard.css'
})
export class OfficialDashboardComponent {
  private readonly authService = inject(AuthService);

  username = localStorage.getItem('name') || 'Official Representative';
  email = localStorage.getItem('email') || 'official@gov.in';
  role = localStorage.getItem('role') || 'OFFICIAL';

  @HostListener('window:profileUpdated')
  onProfileUpdated() {
    this.username = localStorage.getItem('name') || 'Official Representative';
  }

  onLogout() {
    this.authService.logout();
  }
}
