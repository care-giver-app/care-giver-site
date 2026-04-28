// libs/care/src/lib/care/shell/shell.component.ts
import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';

import { NavbarComponent } from '../navbar/navbar.component';
import { ReceiverSelectionComponent } from '../receiver-selection/receiver-selection.component';
import { QuickLogComponent } from '../quick-log/quick-log.component';
import { EventService, ReceiverService } from '@care-giver-site/services';
import { EventMetadata } from '@care-giver-site/models';

@Component({
  selector: 'care-shell',
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    NavbarComponent,
    ReceiverSelectionComponent,
    QuickLogComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild(QuickLogComponent) quickLog!: QuickLogComponent;

  private breakpointObserver = inject(BreakpointObserver);
  private eventService = inject(EventService);
  private receiverService = inject(ReceiverService);
  private destroy$ = new Subject<void>();

  isMobile = false;
  eventTypes: EventMetadata[] = [];

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

  onLogEventType(meta: EventMetadata) {
    this.quickLog.onButtonClick(meta);
  }

  onNewEvent() {
    this.receiverService.notifyEventAdded();
  }
}
