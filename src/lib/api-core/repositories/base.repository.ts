import { Client } from "../types";

export abstract class BaseRepository {
  constructor(protected readonly supabase: Client) {}
}
