import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {

  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  role = '';

  // Show/Hide passwords
  showPassword = false;
  showConfirmPassword = false;

  // Searchable State selection variables
  selectedState = '';
  stateSearchQuery = '';
  showStateDropdown = false;

  // Searchable City selection variables
  selectedCity = '';
  citySearchQuery = '';
  showCityDropdown = false;

  // Geolocation properties
  latitude: number | null = null;
  longitude: number | null = null;
  gpsUsed = false;
  loadingLocation = false;
  locationDetected = false;

  loading = false;
  errorMessage = '';

  // Indian States & Union Territories
  states: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
    'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  // Cities for each State/UT
  citiesMap: { [key: string]: string[] } = {
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati'],
    'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Naharlagun', 'Pasighat'],
    'Assam': ['Guwahati', 'Dibrugarh', 'Silchar', 'Jorhat', 'Nagaon'],
    'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia'],
    'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Rajnandgaon'],
    'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa'],
    'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
    'Haryana': ['Faridabad', 'Gurugram', 'Panipat', 'Ambala', 'Yamunanagar'],
    'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Bilaspur'],
    'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Deoghar'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi-Dharwad', 'Mangaluru', 'Belagavi'],
    'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Kollam', 'Thrissur'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
    'Manipur': ['Imphal', 'Churachandpur', 'Thoubal'],
    'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
    'Mizoram': ['Aizawl', 'Lunglei', 'Saiha'],
    'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
    'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner'],
    'Sikkim': ['Gangtok', 'Namchi', 'Geyzing'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem'],
    'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur'],
    'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Noida', 'Ghaziabad', 'Agra', 'Varanasi'],
    'Uttarakhand': ['Dehradun', 'Haridwar', 'Haldwani', 'Roorkee'],
    'West Bengal': ['Kolkata', 'Howrah', 'Darjeeling', 'Siliguri', 'Asansol'],
    'Andaman and Nicobar Islands': ['Port Blair'],
    'Chandigarh': ['Chandigarh'],
    'Dadra and Nagar Haveli and Daman and Diu': ['Silvassa', 'Daman', 'Diu'],
    'Delhi': ['New Delhi', 'Dwarka', 'Rohini', 'Vasant Kunj'],
    'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla'],
    'Ladakh': ['Leh', 'Kargil'],
    'Lakshadweep': ['Kavaratti'],
    'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam']
  };

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  // Geolocation: Request browser coordinates and reverse-geocode
  useCurrentLocation() {
    this.errorMessage = '';
    this.loadingLocation = true;
    this.locationDetected = false;

    if (!navigator.geolocation) {
      this.errorMessage = 'Your browser does not support location services.';
      this.loadingLocation = false;
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        this.latitude = lat;
        this.longitude = lon;
        this.gpsUsed = true;

        // Perform reverse geocoding via OpenStreetMap Nominatim
        this.http.get<any>(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
          .subscribe({
            next: (res) => {
              this.loadingLocation = false;
              const address = res?.address;
              const state = address?.state || '';
              const city = address?.city || address?.town || address?.village || address?.municipality || address?.county || '';

              if (state && city) {
                // Find matching state case-insensitive
                const matchedState = this.states.find(s => s.toLowerCase() === state.toLowerCase());
                if (matchedState) {
                  this.selectedState = matchedState;
                  this.stateSearchQuery = matchedState;
                } else {
                  this.selectedState = state;
                  this.stateSearchQuery = state;
                }
                this.selectedCity = city;
                this.citySearchQuery = city;
                this.locationDetected = true;
                this.updateErrorMessage();
              } else {
                this.errorMessage = 'Failed to determine city/state from GPS. Please select manually.';
              }
            },
            error: (err) => {
              this.loadingLocation = false;
              console.error('Reverse geocoding failed:', err);
              this.errorMessage = 'Failed to fetch location address. Please select manually.';
            }
          });
      },
      (error) => {
        this.loadingLocation = false;
        if (error.code === error.PERMISSION_DENIED) {
          this.errorMessage = 'Location permission denied. Please select your location manually.';
        } else {
          this.errorMessage = 'Failed to retrieve GPS location.';
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Clear GPS configuration and enable manual entry
  clearGeolocation() {
    this.locationDetected = false;
    this.gpsUsed = false;
    this.latitude = null;
    this.longitude = null;
    this.selectedState = '';
    this.stateSearchQuery = '';
    this.selectedCity = '';
    this.citySearchQuery = '';
    this.updateErrorMessage();
  }

  // Filter States by search query
  filteredStates(): string[] {
    if (!this.stateSearchQuery) {
      return this.states;
    }
    const query = this.stateSearchQuery.toLowerCase();
    return this.states.filter(s => s.toLowerCase().includes(query));
  }

  // Handle State selection
  selectState(state: string) {
    this.selectedState = state;
    this.stateSearchQuery = state;
    this.showStateDropdown = false;
    
    // Reset City selection when State changes
    this.selectedCity = '';
    this.citySearchQuery = '';
    
    this.updateErrorMessage();
  }

  onStateBlur() {
    setTimeout(() => {
      this.showStateDropdown = false;
      const match = this.states.find(s => s.toLowerCase() === this.stateSearchQuery.trim().toLowerCase());
      if (match) {
        this.selectState(match);
      } else {
        this.stateSearchQuery = this.selectedState;
      }
    }, 200);
  }

  // Filter Cities by search query for selected State
  filteredCities(): string[] {
    const citiesList = this.citiesMap[this.selectedState] || [];
    if (!this.citySearchQuery) {
      return citiesList;
    }
    const query = this.citySearchQuery.toLowerCase();
    return citiesList.filter(c => c.toLowerCase().includes(query));
  }

  // Handle City selection
  selectCity(city: string) {
    this.selectedCity = city;
    this.citySearchQuery = city;
    this.showCityDropdown = false;
    this.updateErrorMessage();
  }

  onCityBlur() {
    setTimeout(() => {
      this.showCityDropdown = false;
      const citiesList = this.citiesMap[this.selectedState] || [];
      const match = citiesList.find(c => c.toLowerCase() === this.citySearchQuery.trim().toLowerCase());
      if (match) {
        this.selectCity(match);
      } else {
        this.citySearchQuery = this.selectedCity;
      }
    }, 200);
  }

  // Password Strength evaluation (0 to 4)
  getPasswordStrength(): number {
    const p = this.password;
    if (!p) return 0;
    let strength = 0;
    if (p.length >= 6) strength++;
    if (/[A-Z]/.test(p)) strength++;
    if (/[0-9]/.test(p)) strength++;
    if (/[^A-Za-z0-9]/.test(p)) strength++;
    return strength;
  }

  getPasswordStrengthLabel(): string {
    const strength = this.getPasswordStrength();
    if (!this.password) return '';
    if (strength <= 1) return 'Weak 🔴';
    if (strength <= 3) return 'Medium 🟠';
    return 'Strong 🟢';
  }

  // Real-time validations
  updateErrorMessage() {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (this.name !== '' && !this.name.trim()) {
      this.errorMessage = 'Name is required.';
      return;
    }
    if (this.email !== '' && !emailPattern.test(this.email.trim())) {
      this.errorMessage = 'Please enter a valid email.';
      return;
    }
    if (this.password !== '' && this.password.trim().length < 6) {
      this.errorMessage = 'Password should contain at least 6 characters.';
      return;
    }
    if (this.password !== '' && this.confirmPassword !== '' && this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.errorMessage = '';
  }

  // Form Validity check to disable button until complete and valid
  isFormValid(): boolean {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    const baseValid = !!(
      this.name.trim() &&
      this.email.trim() &&
      emailPattern.test(this.email.trim()) &&
      this.password.trim() &&
      this.password.trim().length >= 6 &&
      this.confirmPassword.trim() &&
      this.password.trim() === this.confirmPassword.trim() &&
      this.role &&
      this.selectedState &&
      this.selectedCity
    );

    if (this.gpsUsed) {
      return baseValid && this.latitude !== null && this.longitude !== null;
    }

    return baseValid;
  }

  onRegister() {
    this.errorMessage = '';

    const trimmedName = this.name.trim();
    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password.trim();
    const trimmedConfirm = this.confirmPassword.trim();

    // Required Validations on submission
    if (!trimmedName) {
      this.errorMessage = 'Name is required.';
      return;
    }
    if (!trimmedEmail) {
      this.errorMessage = 'Please enter a valid email.';
      return;
    }
    if (!trimmedPassword) {
      this.errorMessage = 'Password is required.';
      return;
    }
    if (trimmedPassword.length < 6) {
      this.errorMessage = 'Password should contain at least 6 characters.';
      return;
    }
    if (trimmedPassword !== trimmedConfirm) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (!this.role) {
      this.errorMessage = 'Role is required.';
      return;
    }
    if (!this.selectedState) {
      this.errorMessage = 'State is required.';
      return;
    }
    if (!this.selectedCity) {
      this.errorMessage = 'City is required.';
      return;
    }
    if (this.gpsUsed && (this.latitude === null || this.longitude === null)) {
      this.errorMessage = 'Latitude and Longitude are required.';
      return;
    }

    this.loading = true;

    const userData = {
      name: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      role: this.role,
      state: this.selectedState,
      city: this.selectedCity,
      latitude: this.latitude,
      longitude: this.longitude
    };

    this.http.post<any>(
      'http://localhost:8080/api/auth/register',
      userData
    ).subscribe({
      next: (res) => {
        this.loading = false;
        console.log('Success:', res);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        if (err?.error?.message === 'Email already exists') {
          this.errorMessage = 'Email already registered.';
        } else if (err.status === 0) {
          this.errorMessage = 'Something went wrong.';
        } else {
          this.errorMessage = 'Registration failed.';
        }
      }
    });
  }
}