import { Injectable } from '@nestjs/common';
import { Player, PlayerPosition } from '../../player/entities/player.entity';

@Injectable()
export class YouthAcademyService {
  private readonly positions: PlayerPosition[] = [
    PlayerPosition.GK,
    PlayerPosition.CB,
    PlayerPosition.LB,
    PlayerPosition.RB,
    PlayerPosition.CDM,
    PlayerPosition.CM,
    PlayerPosition.CAM,
    PlayerPosition.LW,
    PlayerPosition.RW,
    PlayerPosition.ST,
  ];

  generateProspects(params: {
    clubId: string;
    nationality: string;
    seasonYear: number;
    amount: number;
  }) {
    const { clubId, nationality, seasonYear, amount } = params;

    return Array.from({ length: amount }).map((_, index) => {
      const position = this.positions[index % this.positions.length];
      const overall = 58 + Math.floor(Math.random() * 8);
      const potential = Math.min(
        92,
        overall + 12 + Math.floor(Math.random() * 10),
      );

      const player = new Player();
      player.name = `Base ${seasonYear} #${index + 1}`;
      player.age = 17 + Math.floor(Math.random() * 2);
      player.nationality = nationality;
      player.position = position;
      player.overall = overall;
      player.potential = potential;
      player.clubId = clubId;
      player.value = Math.max(80000, overall * 9000 + potential * 3000);
      player.salary = Math.max(1200, overall * 90);
      return player;
    });
  }
}
