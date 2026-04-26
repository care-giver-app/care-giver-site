import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@care-giver-site/services';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'care-navbar',
  imports: [CommonModule, RouterModule, MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  @Output() menuToggle = new EventEmitter<void>();

  private authService = inject(AuthService);

  toggleMenu() {
    this.menuToggle.emit();
  }

  signOut() {
    this.authService.signOutUser();
  }
}
