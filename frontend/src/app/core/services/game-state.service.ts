import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly selectedUserIdSignal = signal<string | null>(null);
  private readonly selectedSaveGameIdSignal = signal<string | null>(null);
  private readonly selectedClubIdSignal = signal<string | null>(null);
  private readonly pendingSaveNameSignal = signal<string | null>(null);

  readonly selectedUserId = this.selectedUserIdSignal.asReadonly();
  readonly selectedSaveGameId = this.selectedSaveGameIdSignal.asReadonly();
  readonly selectedClubId = this.selectedClubIdSignal.asReadonly();
  readonly pendingSaveName = this.pendingSaveNameSignal.asReadonly();
  readonly hasActiveSave = computed(() => this.selectedSaveGameIdSignal() !== null);

  selectUser(userId: string) {
    this.selectedUserIdSignal.set(userId);
  }

  selectSaveGame(saveGameId: string) {
    this.selectedSaveGameIdSignal.set(saveGameId);
  }

  selectClub(clubId: string) {
    this.selectedClubIdSignal.set(clubId);
  }

  setPendingSaveName(name: string) {
    this.pendingSaveNameSignal.set(name);
  }

  clearPendingSaveName() {
    this.pendingSaveNameSignal.set(null);
  }

  reset() {
    this.selectedUserIdSignal.set(null);
    this.selectedSaveGameIdSignal.set(null);
    this.selectedClubIdSignal.set(null);
    this.pendingSaveNameSignal.set(null);
  }
}
