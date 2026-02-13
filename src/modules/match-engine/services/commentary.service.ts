import { Injectable } from '@nestjs/common';
import { MatchEventType } from '../../match/entities/match-event.entity';

@Injectable()
export class CommentaryService {
  minuteCommentary(minute: number, homeClubName: string, awayClubName: string) {
    if (minute === 1)
      return `Começa o jogo entre ${homeClubName} e ${awayClubName}.`;
    if (minute === 45) return 'Fim do primeiro tempo.';
    if (minute === 46) return 'Bola rolando para o segundo tempo.';
    if (minute === 90) return 'Fim de partida!';
    return `Minuto ${minute}: a partida segue disputada.`;
  }

  eventCommentary(params: {
    type: MatchEventType;
    clubName: string;
    playerName?: string;
    homeScore: number;
    awayScore: number;
  }) {
    const { type, clubName, playerName, homeScore, awayScore } = params;

    if (type === MatchEventType.GOAL) {
      return `GOL de ${playerName ?? 'jogador'} para ${clubName}! Placar: ${homeScore} x ${awayScore}.`;
    }

    if (type === MatchEventType.YELLOW_CARD) {
      return `Cartão amarelo para ${playerName ?? 'jogador'} (${clubName}).`;
    }

    if (type === MatchEventType.RED_CARD) {
      return `Cartão vermelho para ${playerName ?? 'jogador'} (${clubName}).`;
    }

    if (type === MatchEventType.INJURY) {
      return `${playerName ?? 'Jogador'} sente lesão e preocupa o ${clubName}.`;
    }

    if (type === MatchEventType.SUBSTITUTION) {
      return `Substituição no ${clubName}.`;
    }

    if (type === MatchEventType.TACTIC_CHANGE) {
      return `${clubName} muda a postura tática para buscar o resultado.`;
    }

    return `Evento de jogo para ${clubName}.`;
  }
}
