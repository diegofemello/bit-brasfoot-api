import { Injectable } from '@nestjs/common';
import { Player } from '../../player/entities/player.entity';

@Injectable()
export class PlayerAgingService {
  apply(players: Player[]) {
    players.forEach((player) => {
      player.age += 1;
    });

    return players;
  }
}
