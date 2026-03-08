import { PositionRepository, Position, CreatePositionDto, UpdatePositionDto } from '../repositories/position.repository';
import { Client } from '../types';

export class PositionService {
  private repository: PositionRepository;

  constructor(private client: Client) {
    this.repository = new PositionRepository(this.client);
  }

  async getPositions(salonId: string): Promise<Position[]> {
    return this.repository.getPositions(salonId);
  }

  async updatePosition(positionId: string, dto: UpdatePositionDto): Promise<Position> {
    return this.repository.updatePosition(positionId, dto);
  }

  async deletePosition(positionId: string): Promise<void> {
    return this.repository.deletePosition(positionId);
  }

  async createPosition(salonId: string, dto: CreatePositionDto): Promise<Position> {
    return this.repository.createPosition(salonId, dto);
  }
}

export type { Position, CreatePositionDto, UpdatePositionDto };
