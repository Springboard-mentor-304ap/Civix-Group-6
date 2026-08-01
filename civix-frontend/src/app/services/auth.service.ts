import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = 'http://localhost:8080/api/auth/login';

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(this.API_URL, credentials, { withCredentials: true }).pipe(
      tap(response => {
        if (response && response.token) {
          // Store token in both keys to maintain backward compatibility
          localStorage.setItem('token', response.token);
          localStorage.setItem('accessToken', response.token);
          
          if (response.id !== undefined && response.id !== null) {
            localStorage.setItem('id', response.id.toString());
          }
          if (response.name) {
            localStorage.setItem('name', response.name);
          }
          if (response.email) {
            localStorage.setItem('email', response.email);
          }
          if (response.role) {
            localStorage.setItem('role', response.role);
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('id');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
  }

  getRole(): 'CITIZEN' | 'OFFICIAL' | null {
    return localStorage.getItem('role') as 'CITIZEN' | 'OFFICIAL' | null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
