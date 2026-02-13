import { Injectable } from '@nestjs/common';
import { Player } from '../../player/entities/player.entity';

@Injectable()
export class PlayerEvolutionService {
  apply(players: Player[]) {
    players.forEach((player) => {
      const progressionCap = Math.max(0, player.potential - player.overall);

      let delta = 0;
      if (player.age <= 23) {
        delta = progressionCap > 0 ? 1 : 0;
      } else if (player.age <= 29) {
        delta = progressionCap > 2 ? 1 : 0;
      } else if (player.age <= 33) {
        delta = -1;
      } else {
        delta = -2;
      }

      const nextOverall = Math.max(45, Math.min(99, player.overall + delta));
      player.overall = nextOverall;

      const valueBase = 50000;
      const valueByOverall = nextOverall * 12000;
      const valueByPotential = player.potential * 3500;
      player.value = Math.max(valueBase, valueByOverall + valueByPotential);
    });

    return players;
  }
}
