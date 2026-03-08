import {
  ArtistRepository,
  ArtistProfile,
  ArtistProfileDetail,
  UpdateArtistProfileDto,
} from '../repositories/artist.repository';
import { Client } from '../types';

export class ArtistService {
  private repository: ArtistRepository;

  constructor(private client: Client) {
    this.repository = new ArtistRepository(this.client);
  }

  async getArtists(salonId: string, includePortfolio: boolean): Promise<ArtistProfile[]> {
    return this.repository.getArtists(salonId, includePortfolio);
  }

  async getProfile(userId: string): Promise<ArtistProfileDetail> {
    return this.repository.getProfile(userId);
  }

  async updateProfile(userId: string, dto: UpdateArtistProfileDto): Promise<ArtistProfileDetail> {
    return this.repository.updateProfile(userId, dto);
  }

  async uploadPortfolioItem(
    userId: string,
    imageUrl: string,
    caption?: string,
    tags?: string[],
    isPublic?: boolean
  ): Promise<unknown> {
    return this.repository.uploadPortfolioItem(userId, imageUrl, caption, tags, isPublic);
  }

  async reorderPortfolio(
    userId: string,
    itemOrders: { itemId: string; displayOrder: number }[]
  ): Promise<void> {
    return this.repository.reorderPortfolio(userId, itemOrders);
  }

  async updatePortfolioItem(
    userId: string,
    itemId: string,
    updates: { caption?: string; tags?: string[]; isPublic?: boolean }
  ): Promise<unknown> {
    return this.repository.updatePortfolioItem(userId, itemId, updates);
  }

  async deletePortfolioItem(userId: string, itemId: string): Promise<void> {
    return this.repository.deletePortfolioItem(userId, itemId);
  }

  async importInstagramMedia(
    artistId: string,
    mediaList: Array<{
      id: string;
      media_type: string;
      media_url: string;
      thumbnail_url?: string;
      caption?: string;
      permalink?: string;
    }>
  ): Promise<{ imported: number; skipped: number; items: unknown[] }> {
    return this.repository.importInstagramMedia(artistId, mediaList);
  }

  async getPublicPortfolio(artistId: string): Promise<unknown[]> {
    return this.repository.getPublicPortfolio(artistId);
  }

  async getMyPortfolio(userId: string): Promise<unknown[]> {
    return this.repository.getMyPortfolio(userId);
  }
}

export type { ArtistProfile, ArtistProfileDetail, UpdateArtistProfileDto, PortfolioItem } from '../repositories/artist.repository';
