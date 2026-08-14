import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { HomeComponent } from './pages/home/home';
import { CitizenDashboardComponent } from './pages/citizen-dashboard/citizen-dashboard';
import { CitizenHomeComponent } from './pages/citizen-dashboard/home/home';
import { CitizenPetitionsComponent } from './pages/citizen-dashboard/petitions/petitions';
import { CitizenPollsComponent } from './pages/citizen-dashboard/polls/polls';
import { CitizenOfficialsComponent } from './pages/citizen-dashboard/officials/officials';
import { CitizenProfileComponent } from './pages/citizen-dashboard/profile/profile';
import { OfficialDashboardComponent } from './pages/official-dashboard/official-dashboard';
import { OfficialHomeComponent } from './pages/official-dashboard/home/home';
import { OfficialPetitionsComponent } from './pages/official-dashboard/petitions/petitions';
import { OfficialPollsComponent } from './pages/official-dashboard/polls/polls';
import { OfficialQueriesComponent } from './pages/official-dashboard/queries/queries';
import { OfficialProfileComponent } from './pages/official-dashboard/profile/profile';
import { OfficialReportsComponent } from './pages/official-dashboard/reports/reports';
import { authGuard, guestGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  
  // Protected dashboards
  { 
    path: 'citizen-dashboard', 
    component: CitizenDashboardComponent, 
    canActivate: [authGuard, roleGuard],
    data: { role: 'CITIZEN' },
    children: [
      { path: '', component: CitizenHomeComponent },
      { path: 'petitions', component: CitizenPetitionsComponent },
      { path: 'polls', component: CitizenPollsComponent },
      { path: 'officials', component: CitizenOfficialsComponent },
      { path: 'profile', component: CitizenProfileComponent }
    ]
  },
  { 
    path: 'official-dashboard', 
    component: OfficialDashboardComponent, 
    canActivate: [authGuard, roleGuard],
    data: { role: 'OFFICIAL' },
    children: [
      { path: '', component: OfficialHomeComponent },
      { path: 'petitions', component: OfficialPetitionsComponent },
      { path: 'polls', component: OfficialPollsComponent },
      { path: 'queries', component: OfficialQueriesComponent },
      { path: 'reports', component: OfficialReportsComponent },
      { path: 'profile', component: OfficialProfileComponent }
    ]
  },
  
  // Generic dashboard fallback
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  
  // Landing page public root
  { path: '', component: HomeComponent, canActivate: [guestGuard] }
];