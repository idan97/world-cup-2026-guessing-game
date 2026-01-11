import prisma from '../db';
import type { Prisma } from '@prisma/client';
import type { Form, MatchPick } from '../types';

type FormWithPicks = Prisma.FormGetPayload<{
  include: { matchPicks: true; topScorerPicks: true };
}>;

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
  static async getFormWithPicks(id: string): Promise<FormWithPicks | null> {
    return await prisma.form.findUnique({
      where: { id },
      include: {
        matchPicks: true,
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
    matchPicks: MatchPick[],
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

  // Save top scorer pick (upsert)
  static async saveTopScorerPick(
    formId: string,
    playerName: string,
  ): Promise<void> {
    await prisma.topScorerPick.upsert({
      where: { formId },
      update: { playerName },
      create: { formId, playerName },
    });
  }

  // Combined method to save all picks atomically
  static async savePicks(
    formId: string,
    picks: {
      matchPicks?: MatchPick[] | undefined;
      topScorerPicks?: Array<{ playerName: string }> | undefined;
    },
  ): Promise<void> {
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
