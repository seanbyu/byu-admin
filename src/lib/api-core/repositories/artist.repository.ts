import { BaseRepository } from './base.repository';

export interface PortfolioItem {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  caption: string;
}

export interface ArtistProfile {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  specialties: string[] | null;
  yearsOfExperience: number | null;
  socialLinks: Record<string, string> | null;
  isOwner: boolean;
  displayOrder: number;
  portfolio?: PortfolioItem[];
}

export interface ArtistProfileDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  bio: string;
  specialties: string[];
  yearsOfExperience: number;
  socialLinks: Record<string, unknown>;
  salonId: string | null;
  isOwner: boolean;
}

export interface UpdateArtistProfileDto {
  name?: string;
  phone?: string;
  profileImage?: string;
  bio?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  socialLinks?: Record<string, unknown>;
}

export class ArtistRepository extends BaseRepository {
  private async fetchProfileRow(userId: string) {
    const { data, error } = await (this.supabase as any)
      .from('users')
      .select(`
        id,
        name,
        email,
        phone,
        profile_image,
        staff_profiles!staff_profiles_user_id_fkey (
          bio,
          specialties,
          years_of_experience,
          social_links,
          salon_id,
          is_owner
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    const staffProfile = Array.isArray(data.staff_profiles)
      ? data.staff_profiles[0]
      : data.staff_profiles;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      profileImage: data.profile_image,
      bio: staffProfile?.bio ?? '',
      specialties: staffProfile?.specialties ?? [],
      yearsOfExperience: staffProfile?.years_of_experience ?? 0,
      socialLinks: staffProfile?.social_links ?? {},
      salonId: staffProfile?.salon_id ?? null,
      isOwner: staffProfile?.is_owner ?? false,
    } as ArtistProfileDetail;
  }

  async getProfile(userId: string): Promise<ArtistProfileDetail> {
    return this.fetchProfileRow(userId);
  }

  async uploadPortfolioItem(
    userId: string,
    imageUrl: string,
    caption?: string,
    tags?: string[],
    isPublic?: boolean
  ): Promise<unknown> {
    const { data: existing } = await (this.supabase as any)
      .from('portfolio_items')
      .select('display_order')
      .eq('artist_id', userId)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = (existing?.[0]?.display_order ?? -1) + 1;

    const { data, error } = await (this.supabase as any)
      .from('portfolio_items')
      .insert({
        artist_id: userId,
        source_type: 'manual',
        image_url: imageUrl,
        thumbnail_url: imageUrl,
        caption: caption ?? null,
        tags: tags ?? null,
        display_order: nextOrder,
        is_public: isPublic ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async reorderPortfolio(
    userId: string,
    itemOrders: { itemId: string; displayOrder: number }[]
  ): Promise<void> {
    const itemIds = itemOrders.map(i => i.itemId);

    const { data: existingItems } = await (this.supabase as any)
      .from('portfolio_items')
      .select('id, artist_id')
      .in('id', itemIds);

    const validItems = (existingItems ?? []).filter((item: { artist_id: string }) => item.artist_id === userId);
    if (validItems.length !== itemIds.length) {
      throw Object.assign(new Error('Some items not found or unauthorized'), { status: 403 });
    }

    const results = await Promise.all(
      itemOrders.map(({ itemId, displayOrder }) =>
        (this.supabase as any)
          .from('portfolio_items')
          .update({ display_order: displayOrder, updated_at: new Date().toISOString() })
          .eq('id', itemId)
          .eq('artist_id', userId)
      )
    );

    const failed = results.find((r: { error: unknown }) => r.error);
    if (failed) throw failed.error;
  }

  async updatePortfolioItem(
    userId: string,
    itemId: string,
    updates: { caption?: string; tags?: string[]; isPublic?: boolean }
  ): Promise<unknown> {
    const { data: existing } = await (this.supabase as any)
      .from('portfolio_items')
      .select('artist_id')
      .eq('id', itemId)
      .single();

    if (!existing || existing.artist_id !== userId) {
      throw Object.assign(new Error('Portfolio item not found or unauthorized'), { status: 404 });
    }

    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.caption !== undefined) dbUpdates.caption = updates.caption;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.isPublic !== undefined) dbUpdates.is_public = updates.isPublic;

    const { data, error } = await (this.supabase as any)
      .from('portfolio_items')
      .update(dbUpdates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deletePortfolioItem(userId: string, itemId: string): Promise<void> {
    const { error } = await (this.supabase as any)
      .from('portfolio_items')
      .delete()
      .eq('id', itemId)
      .eq('artist_id', userId);

    if (error) throw error;
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
    const mediaIds = mediaList.map(m => m.id);

    const { data: existingOrder } = await (this.supabase as any)
      .from('portfolio_items')
      .select('display_order')
      .eq('artist_id', artistId)
      .order('display_order', { ascending: false })
      .limit(1);

    let nextOrder = (existingOrder?.[0]?.display_order ?? -1) + 1;

    const { data: existingMedia } = await (this.supabase as any)
      .from('portfolio_items')
      .select('source_id')
      .eq('artist_id', artistId)
      .eq('source_type', 'instagram')
      .in('source_id', mediaIds);

    const existingSourceIds = new Set<string>(
      (existingMedia ?? []).map((m: { source_id: string }) => m.source_id)
    );

    const newItems = mediaList
      .filter(media => !existingSourceIds.has(media.id))
      .map(media => ({
        artist_id: artistId,
        source_type: 'instagram',
        source_id: media.id,
        image_url: media.media_type === 'VIDEO' ? media.thumbnail_url : media.media_url,
        thumbnail_url: media.thumbnail_url || media.media_url,
        caption: media.caption ?? null,
        display_order: nextOrder++,
        is_public: true,
        instagram_permalink: media.permalink ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

    if (newItems.length === 0) {
      return { imported: 0, skipped: mediaIds.length, items: [] };
    }

    const { data: insertedItems, error } = await (this.supabase as any)
      .from('portfolio_items')
      .insert(newItems)
      .select();

    if (error) throw error;

    return {
      imported: insertedItems?.length ?? 0,
      skipped: mediaIds.length - newItems.length,
      items: insertedItems ?? [],
    };
  }

  async getPublicPortfolio(artistId: string): Promise<unknown[]> {
    const { data, error } = await (this.supabase as any)
      .from('portfolio_items')
      .select('id, image_url, thumbnail_url, caption, tags, display_order, created_at')
      .eq('artist_id', artistId)
      .eq('is_public', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async getMyPortfolio(userId: string): Promise<unknown[]> {
    const { data, error } = await (this.supabase as any)
      .from('portfolio_items')
      .select('*')
      .eq('artist_id', userId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }

  async updateProfile(userId: string, dto: UpdateArtistProfileDto): Promise<ArtistProfileDetail> {
    const userUpdates: Record<string, unknown> = {};
    if (dto.name !== undefined) userUpdates.name = dto.name;
    if (dto.phone !== undefined) userUpdates.phone = dto.phone;
    if (dto.profileImage !== undefined) userUpdates.profile_image = dto.profileImage;

    if (Object.keys(userUpdates).length > 0) {
      userUpdates.updated_at = new Date().toISOString();
      const { error } = await (this.supabase as any)
        .from('users')
        .update(userUpdates)
        .eq('id', userId);
      if (error) throw error;
    }

    const staffUpdates: Record<string, unknown> = {};
    if (dto.bio !== undefined) staffUpdates.bio = dto.bio;
    if (dto.specialties !== undefined) staffUpdates.specialties = dto.specialties;
    if (dto.yearsOfExperience !== undefined) staffUpdates.years_of_experience = dto.yearsOfExperience;
    if (dto.socialLinks !== undefined) staffUpdates.social_links = dto.socialLinks;

    if (Object.keys(staffUpdates).length > 0) {
      staffUpdates.updated_at = new Date().toISOString();
      const { error } = await (this.supabase as any)
        .from('staff_profiles')
        .update(staffUpdates)
        .eq('user_id', userId);
      if (error) throw error;
    }

    return this.fetchProfileRow(userId);
  }

  async getArtists(salonId: string, includePortfolio: boolean): Promise<ArtistProfile[]> {
    const { data: artists, error } = await (this.supabase as any)
      .from('staff_profiles')
      .select(`
        user_id,
        bio,
        specialties,
        years_of_experience,
        social_links,
        is_owner,
        display_order,
        users!staff_profiles_user_id_fkey (
          id,
          name,
          profile_image
        )
      `)
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    let portfolioMap: Record<string, PortfolioItem[]> = {};

    if (includePortfolio && artists && artists.length > 0) {
      const artistIds = (artists as Array<{ user_id: string }>).map(d => d.user_id);

      const { data: portfolios } = await (this.supabase as any)
        .from('portfolio_items')
        .select('artist_id, id, image_url, thumbnail_url, caption')
        .in('artist_id', artistIds)
        .eq('is_public', true)
        .order('display_order', { ascending: true })
        .limit(6);

      if (portfolios) {
        (portfolios as Array<{ artist_id: string; id: string; image_url: string; thumbnail_url: string; caption: string }>)
          .forEach(p => {
            if (!portfolioMap[p.artist_id]) portfolioMap[p.artist_id] = [];
            portfolioMap[p.artist_id].push({
              id: p.id,
              imageUrl: p.image_url,
              thumbnailUrl: p.thumbnail_url,
              caption: p.caption,
            });
          });
      }
    }

    return (artists as any[])
      .map((d) => {
        const rawUser = Array.isArray(d.users) ? d.users[0] : d.users;
        if (!rawUser) return null;
        return {
          id: rawUser.id,
          name: rawUser.name,
          profileImage: rawUser.profile_image,
          bio: d.bio,
          specialties: d.specialties,
          yearsOfExperience: d.years_of_experience,
          socialLinks: d.social_links,
          isOwner: d.is_owner,
          displayOrder: d.display_order,
          portfolio: includePortfolio ? (portfolioMap[d.user_id] || []) : undefined,
        } as ArtistProfile;
      })
      .filter((item): item is ArtistProfile => item !== null);
  }
}
