import { Component, HostListener, AfterViewInit, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent implements AfterViewInit {
  private readonly el = inject(ElementRef);
  
  isScrolled = false;
  mobileMenuOpen = false;

  // Toggle scrolled state on window scroll to activate glassmorphism navbar
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  // Smooth scroll helper for navbar links
  smoothScroll(event: Event, targetId: string) {
    event.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  ngAfterViewInit() {
    // Setup count-up statistics with IntersectionObserver
    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCountUp(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px' // Trigger slightly before it is fully in view
      });

      const statNumbers = this.el.nativeElement.querySelectorAll('.stat-num');
      statNumbers.forEach((el: HTMLElement) => {
        observer.observe(el);
      });
    } else {
      // Fallback if IntersectionObserver is not supported
      const statNumbers = this.el.nativeElement.querySelectorAll('.stat-num');
      statNumbers.forEach((el: HTMLElement) => {
        const target = el.getAttribute('data-target') || '0';
        el.innerText = parseInt(target, 10).toLocaleString();
      });
    }
  }

  private animateCountUp(element: HTMLElement) {
    const targetVal = parseInt(element.getAttribute('data-target') || '0', 10);
    const duration = 2000; // Animation duration in ms (2 seconds)
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quadratic ease-out for a smooth finish
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.floor(easeProgress * targetVal);
      
      element.innerText = currentVal.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.innerText = targetVal.toLocaleString();
      }
    };

    requestAnimationFrame(step);
  }
}
