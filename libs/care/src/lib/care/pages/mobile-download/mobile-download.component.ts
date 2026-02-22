import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../navbar/navbar.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'lib-mobile-download',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FormsModule,
    MatButtonModule,
  ],
  templateUrl: './mobile-download.component.html',
  styleUrls: ['./mobile-download.component.css'],
})
export class MobileDownloadComponent{}