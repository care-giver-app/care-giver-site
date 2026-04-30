// libs/care/src/lib/care/shell/shell.component.ts
import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';

import { NavbarComponent } from '../navbar/navbar.component';
import { ReceiverSelectionComponent } from '../receiver-selection/receiver-selection.component';
import { EventFormModalComponent } from '../modal/event-form-modal/event-form-modal.component';
import { AuthService, EventService, ReceiverService } from '@care-giver-site/services';
import { EventMetadata } from '@care-giver-site/models';

@Component({
  selector: 'care-shell',
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    NavbarComponent,
    ReceiverSelectionComponent,
    EventFormModalComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  private eventService = inject(EventService);
  private receiverService = inject(ReceiverService);
  private destroy$ = new Subject<void>();

  isMobile = false;
  eventTypes: EventMetadata[] = [];
  showFormModal = false;

  ngOnInit() {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        this.isMobile = result.matches;
      });

    this.eventService.eventConfigs$
      .pipe(takeUntil(this.destroy$))
      .subscribe(configs => {
        this.eventTypes = configs;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMenuToggle() {
    this.sidenav.toggle();
  }

  onNavItemClick() {
    if (this.isMobile) {
      this.sidenav.close();
    }
  }

  onFabClick() {
    this.showFormModal = true;
  }

  onNewEvent() {
    this.receiverService.notifyEventAdded();
  }

  signOut() {
    this.authService.signOutUser();
  }
}
