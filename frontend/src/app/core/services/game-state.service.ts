import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private readonly selectedUserIdSignal = signal<string | null>(null);
  private readonly selectedSaveGameIdSignal = signal<string | null>(null);

  readonly selectedUserId = this.selectedUserIdSignal.asReadonly();
  readonly selectedSaveGameId = this.selectedSaveGameIdSignal.asReadonly();
  readonly hasActiveSave = computed(() => this.selectedSaveGameIdSignal() !== null);

  selectUser(userId: string) {
    this.selectedUserIdSignal.set(userId);
  }

  selectSaveGame(saveGameId: string) {
    this.selectedSaveGameIdSignal.set(saveGameId);
  }

  reset() {
    this.selectedUserIdSignal.set(null);
    this.selectedSaveGameIdSignal.set(null);
  }
}
