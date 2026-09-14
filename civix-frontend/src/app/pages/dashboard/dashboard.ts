import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  
  username: string = 'Civic Member';
  email: string = 'user@civix.gov.in';
  role: string = 'CITIZEN';

  constructor(private router: Router) {
    // Decode token to show actual email/role if possible
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.sub) {
          this.email = payload.sub;
          this.username = payload.sub.split('@')[0];
        }
        // Check if there is role in token or default to CITIZEN
        if (payload.role) {
          this.role = payload.role;
        }
      } catch (e) {
        console.error('Failed to parse token payload', e);
      }
    }
  }

  onLogout() {
    localStorage.removeItem('accessToken');
    this.router.navigate(['/login']);
  }
}
