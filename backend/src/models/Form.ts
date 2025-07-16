import prisma from '../db';
import type { Form, MatchPick, AdvancePick } from '../types';

export class FormModel {
  // Basic CRUD operations
  static async findById(id: string): Promise<Form | null> {
    return await prisma.form.findUnique({
      where: { id },
    });
  }

  static async findByOwnerId(ownerId: string): Promise<Form | null> {
    return await prisma.form.findUnique({
      where: { ownerId },
    });
  }

  static async create(ownerId: string, nickname: string): Promise<Form> {
    return await prisma.form.create({
      data: {
        ownerId,
        nickname,
      },
    });
  }

  static async update(id: string, data: Partial<Form>): Promise<Form> {
    return await prisma.form.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string): Promise<void> {
    await prisma.form.delete({
      where: { id },
    });
  }

  // Check if user already has a form
  static async userHasForm(ownerId: string): Promise<boolean> {
    const form = await this.findByOwnerId(ownerId);
    return !!form;
  }

  // Get form with full details including picks
  static async getFormWithPicks(id: string): Promise<any> {
    return await prisma.form.findUnique({
      where: { id },
      include: {
        matchPicks: true,
        advancePicks: true,
        topScorerPicks: true,
      },
    });
  }

  // Mark form as submitted/final
  static async markAsSubmitted(id: string): Promise<Form> {
    return await prisma.form.update({
      where: { id },
      data: {
        submittedAt: new Date(),
        isFinal: true,
      },
    });
  }

  // Save match picks (upsert)
  static async saveMatchPicks(
    formId: string,
    matchPicks: MatchPick[]
  ): Promise<void> {
    // Delete existing match picks for this form
    await prisma.matchPick.deleteMany({
      where: { formId },
    });

    // Insert new match picks
    if (matchPicks.length > 0) {
      await prisma.matchPick.createMany({
        data: matchPicks,
      });
    }
  }

  // Save advance picks (upsert)
  static async saveAdvancePicks(
    formId: string,
    advancePicks: AdvancePick[]
  ): Promise<void> {
    // Delete existing advance picks for this form
    await prisma.advancePick.deleteMany({
      where: { formId },
    });

    // Insert new advance picks
    if (advancePicks.length > 0) {
      await prisma.advancePick.createMany({
        data: advancePicks,
      });
    }
  }

  // Save top scorer pick (upsert)
  static async saveTopScorerPick(
    formId: string,
    playerName: string
  ): Promise<void> {
    await prisma.topScorerPick.upsert({
      where: { formId },
      update: { playerName },
      create: { formId, playerName },
    });
  }

  // Combined method to save all picks atomically
  static async savePicks(formId: string, picks: any): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Save match picks
      if (picks.matchPicks) {
        await tx.matchPick.deleteMany({
          where: { formId },
        });
        if (picks.matchPicks.length > 0) {
          await tx.matchPick.createMany({
            data: picks.matchPicks,
          });
        }
      }

      // Save advance picks
      if (picks.advancePicks) {
        await tx.advancePick.deleteMany({
          where: { formId },
        });
        if (picks.advancePicks.length > 0) {
          await tx.advancePick.createMany({
            data: picks.advancePicks,
          });
        }
      }

      // Save top scorer picks
      if (picks.topScorerPicks && picks.topScorerPicks.length > 0) {
        const topScorerPick = picks.topScorerPicks[0]; // Should only be one
        if (topScorerPick) {
          await tx.topScorerPick.upsert({
            where: { formId },
            update: { playerName: topScorerPick.playerName },
            create: { formId, playerName: topScorerPick.playerName },
          });
        }
      }
    });
  }
}
