import { Injectable } from '@nestjs/common';

@Injectable()
export class PromotionRelegationService {
  process() {
    return {
      promoted: [] as string[],
      relegated: [] as string[],
      note: 'MVP sem mudanças estruturais de divisões (apenas registro de processamento).',
    };
  }
}
