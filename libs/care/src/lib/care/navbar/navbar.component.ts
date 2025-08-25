import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Receiver } from '@care-giver-site/models'
import { AuthService } from '@care-giver-site/services'
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button'
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'care-navbar',
  imports: [CommonModule, MatMenuModule, MatButtonModule, MatIconModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  private authService = inject(AuthService);

  showDropdown: boolean = false;
  userName: string = "";

  constructor() {
    this.getUserFirstName();
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  getUserFirstName() {
    this.authService.getUserFirstName().then((firstName) => {
      this.userName = firstName;
    });
  }

  signOut() {
    this.authService.signOutUser().then(() => {
      window.location.reload();
    })
  }
}
