import { BaseRepository } from './base.repository';

export interface Position {
  id: string;
  salonId: string;
  name: string;
  name_en: string;
  name_th: string;
  rank: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePositionDto {
  name: string;
  name_en?: string;
  name_th?: string;
  rank?: number;
  displayOrder?: number;
}

export interface UpdatePositionDto {
  name?: string;
  name_en?: string;
  name_th?: string;
  rank?: number;
  displayOrder?: number;
}

interface DBPositionRow {
  id: string;
  salon_id: string;
  name: string;
  name_en: string;
  name_th: string;
  level: number;
  created_at: string;
  updated_at: string;
}

function rowToPosition(row: DBPositionRow): Position {
  return {
    id: row.id,
    salonId: row.salon_id,
    name: row.name,
    name_en: row.name_en,
    name_th: row.name_th,
    rank: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PositionRepository extends BaseRepository {
  async getPositions(salonId: string): Promise<Position[]> {
    const { data, error } = await (this.supabase as any)
      .from('staff_positions')
      .select('id, salon_id, name, name_en, name_th, level, display_order, is_active, created_at, updated_at')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return (data ?? []).map(rowToPosition);
  }

  async updatePosition(positionId: string, dto: UpdatePositionDto): Promise<Position> {
    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.name_en !== undefined) updates.name_en = dto.name_en ?? '';
    if (dto.name_th !== undefined) updates.name_th = dto.name_th ?? '';
    if (dto.rank !== undefined) updates.level = dto.rank;
    if (dto.displayOrder !== undefined) updates.display_order = dto.displayOrder;

    const { data, error } = await (this.supabase as any)
      .from('staff_positions')
      .update(updates)
      .eq('id', positionId)
      .select()
      .single();

    if (error) throw error;
    return rowToPosition(data as DBPositionRow);
  }

  async deletePosition(positionId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('staff_positions')
      .delete()
      .eq('id', positionId);

    if (error) throw error;
  }

  async createPosition(salonId: string, dto: CreatePositionDto): Promise<Position> {
    const { data, error } = await (this.supabase as any)
      .from('staff_positions')
      .insert({
        salon_id: salonId,
        name: dto.name,
        name_en: dto.name_en || '',
        name_th: dto.name_th || '',
        level: dto.rank || 1,
        display_order: dto.displayOrder || 0,
      })
      .select()
      .single();

    if (error) throw error;
    return rowToPosition(data as DBPositionRow);
  }
}
