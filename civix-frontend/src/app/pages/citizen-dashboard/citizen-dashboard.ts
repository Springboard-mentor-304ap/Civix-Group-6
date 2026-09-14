import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-citizen-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './citizen-dashboard.html',
  styleUrl: './citizen-dashboard.css'
})
export class CitizenDashboardComponent {
  private readonly authService = inject(AuthService);
  
  username = localStorage.getItem('name') || 'Civic Member';
  email = localStorage.getItem('email') || 'user@civix.gov.in';
  role = localStorage.getItem('role') || 'CITIZEN';

  @HostListener('window:profileUpdated')
  onProfileUpdated() {
    this.username = localStorage.getItem('name') || 'Civic Member';
  }

  onLogout() {
    this.authService.logout();
  }
}
