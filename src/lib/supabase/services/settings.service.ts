// Settings Service - Manage user settings and preferences
import { supabase, requireAuth } from '../client';
import type { UserSettings, UserSettingsInsert, UserSettingsUpdate } from '../database.types';

export class SettingsService {
  /**
   * Get user settings
   */
  static async getSettings(): Promise<UserSettings | null> {
    const userId = await requireAuth();
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  }

  /**
   * Create or update settings
   */
  static async upsertSettings(settings: Omit<UserSettingsInsert, 'user_id'>): Promise<UserSettings> {
    const userId = await requireAuth();
    
    const { data, error } = await (supabase as any)
      .from('user_settings')
      .upsert({
        ...settings,
        user_id: userId,
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Update theme
   */
  static async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<UserSettings> {
    return this.upsertSettings({ theme });
  }

  /**
   * Update settings JSON
   */
  static async updateSettingsJson(settingsJson: Record<string, any>): Promise<UserSettings> {
    return this.upsertSettings({ settings_json: settingsJson });
  }

  /**
   * Get theme
   */
  static async getTheme(): Promise<'light' | 'dark' | 'system'> {
    const settings = await this.getSettings();
    return settings?.theme ?? 'system';
  }
}
