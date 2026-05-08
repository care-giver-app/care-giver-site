import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CareGiverListComponent } from './care-giver-list.component';
import { CareGiver } from '@care-giver-site/models';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

const mockCareGivers: CareGiver[] = [
  { userId: 'User#1', firstName: 'Jane', lastName: 'Smith', isPrimary: true },
  { userId: 'User#2', firstName: 'Bob', lastName: 'Jones', isPrimary: false },
];

describe('CareGiverListComponent', () => {
  let fixture: ComponentFixture<CareGiverListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CareGiverListComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CareGiverListComponent);
  });

  it('renders all caregiver names', () => {
    fixture.componentInstance.careGivers = mockCareGivers;
    fixture.componentInstance.isPrimary = false;
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Jane Smith');
    expect(el.textContent).toContain('Bob Jones');
  });

  it('shows Add button when isPrimary is true', () => {
    fixture.componentInstance.careGivers = mockCareGivers;
    fixture.componentInstance.isPrimary = true;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.add-caregiver-btn');
    expect(button).toBeTruthy();
  });

  it('hides Add button when isPrimary is false', () => {
    fixture.componentInstance.careGivers = mockCareGivers;
    fixture.componentInstance.isPrimary = false;
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.add-caregiver-btn');
    expect(button).toBeFalsy();
  });

  it('emits addCareGiver with trimmed email when modal is submitted', () => {
    fixture.componentInstance.careGivers = mockCareGivers;
    fixture.componentInstance.isPrimary = true;
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.addCareGiver.subscribe((email: string) => emitted.push(email));

    fixture.componentInstance.newCareGiverEmail = '  new@example.com  ';
    fixture.componentInstance.submitAddCareGiver();

    expect(emitted).toEqual(['new@example.com']);
    expect(fixture.componentInstance.newCareGiverEmail).toBe('');
    expect(fixture.componentInstance.showAddModal).toBe(false);
  });

  it('does not emit when email is empty', () => {
    fixture.componentInstance.isPrimary = true;
    fixture.detectChanges();

    const emitted: string[] = [];
    fixture.componentInstance.addCareGiver.subscribe((email: string) => emitted.push(email));

    fixture.componentInstance.newCareGiverEmail = '   ';
    fixture.componentInstance.submitAddCareGiver();

    expect(emitted).toEqual([]);
    expect(fixture.componentInstance.showAddModal).toBe(false);
  });
});
