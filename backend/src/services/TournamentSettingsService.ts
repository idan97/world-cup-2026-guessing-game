import prisma from '../db';
import type { TournamentSettings } from '@prisma/client';

/**
 * שירות לניהול הגדרות המונדיאל
 */
export class TournamentSettingsService {
  private static readonly SETTINGS_ID = 'tournament_2026';

  /**
   * מחזיר את ההגדרות הנוכחיות של המונדיאל
   */
  static async getSettings(): Promise<TournamentSettings> {
    let settings = await prisma.tournamentSettings.findUnique({
      where: { id: this.SETTINGS_ID },
    });

    // יצירת הגדרות ברירת מחדל אם לא קיימות
    if (!settings) {
      settings = await prisma.tournamentSettings.create({
        data: {
          id: this.SETTINGS_ID,
          actualTopScorer: null,
        },
      });
    }

    return settings;
  }

  /**
   * מחזיר את שם מלך השערים האמיתי
   */
  static async getActualTopScorer(): Promise<string | null> {
    const settings = await this.getSettings();
    return settings.actualTopScorer;
  }

  /**
   * מעדכן את שם מלך השערים האמיתי
   */
  static async setActualTopScorer(playerName: string | null): Promise<void> {
    await prisma.tournamentSettings.upsert({
      where: { id: this.SETTINGS_ID },
      update: { actualTopScorer: playerName },
      create: {
        id: this.SETTINGS_ID,
        actualTopScorer: playerName,
      },
    });
  }
}
