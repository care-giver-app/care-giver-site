import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Receiver } from '@care-giver-site/models'
import { AuthService } from '@care-giver-site/services'
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button'


@Component({
  selector: 'care-navbar',
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private authService = inject(AuthService);

  showDropdown: boolean = false;
  userName: string = "";

  constructor() {
    this.getUserInitials();
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  getUserInitials() {
    this.authService.getUsersFullName().then((fullName) => {
      this.userName = fullName;
    });
  }

  signOut() {
    this.authService.signOutUser().then(() => {
      window.location.reload();
    })
  }
}
