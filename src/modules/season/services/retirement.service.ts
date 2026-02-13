import { Injectable } from '@nestjs/common';
import { Player } from '../../player/entities/player.entity';

@Injectable()
export class RetirementService {
  selectRetirees(players: Player[]) {
    return players.filter((player) => {
      if (player.age < 35) {
        return false;
      }

      const riskByAge = player.age >= 38 ? 0.8 : player.age >= 36 ? 0.5 : 0.25;
      const riskByOverall = player.overall <= 70 ? 0.2 : 0;
      return Math.random() < Math.min(0.95, riskByAge + riskByOverall);
    });
  }
}
