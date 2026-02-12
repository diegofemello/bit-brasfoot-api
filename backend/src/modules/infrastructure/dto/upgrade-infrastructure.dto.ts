import { IsIn, IsUUID } from 'class-validator';

export class UpgradeInfrastructureDto {
  @IsUUID()
  saveGameId!: string;

  @IsIn(['training', 'youth', 'medical', 'stadium'])
  type!: 'training' | 'youth' | 'medical' | 'stadium';
}
