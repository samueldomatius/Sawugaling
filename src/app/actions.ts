'use server';

import { prisma } from '@/lib/prisma';
import { chaptersData } from '@/lib/chaptersData';

export async function getProfile(uniqueCode: string) {
  const user = await prisma.user.findUnique({
    where: { uniqueCode },
  });
  if (!user) return null;
  return {
    uniqueCode: user.uniqueCode,
    name: user.name,
    className: user.className,
    xp: user.xp,
    hearts: user.hearts,
    streak: user.streak,
    crowns: user.crowns,
    inventory: user.inventory,
    lastSpinTime: user.lastSpinTime ? user.lastSpinTime.toISOString() : null,
    registeredAt: user.registeredAt.toISOString(),
  };
}

export async function registerUser(uniqueCode: string, name: string, className: string) {
  const existing = await prisma.user.findUnique({ where: { uniqueCode } });
  if (existing) throw new Error("Unique code already taken");
  
  await prisma.user.create({
    data: {
      uniqueCode,
      name,
      className,
      xp: 0,
      hearts: 5,
      streak: 0,
      crowns: 0,
      inventory: [],
    }
  });
}

export async function loginUser(uniqueCode: string) {
  const user = await prisma.user.findUnique({ where: { uniqueCode } });
  if (!user) throw new Error("User not found");
  
  // Log visitor
  await prisma.visitorLog.create({
    data: { userId: user.id }
  });
  return user;
}

export async function getChapterProgress(uniqueCode: string, chapterId: number) {
  const user = await prisma.user.findUnique({ where: { uniqueCode } });
  if (!user) throw new Error("User not found");

  let progress = await prisma.chapterProgress.findUnique({
    where: { userId_chapterId: { userId: user.id, chapterId } }
  });

  if (!progress) {
    progress = await prisma.chapterProgress.create({
      data: { userId: user.id, chapterId }
    });
  }

  return {
    chapterId: progress.chapterId,
    materiDone: progress.materiDone,
    dhongengDone: progress.dhongengDone,
    lkpdScore: progress.lkpdScore,
    gameDone: progress.gameDone,
  };
}

export async function updateChapterProgress(uniqueCode: string, chapterId: number, field: string, value: any) {
  const user = await prisma.user.findUnique({ where: { uniqueCode } });
  if (!user) return;
  
  await prisma.chapterProgress.update({
    where: { userId_chapterId: { userId: user.id, chapterId } },
    data: { [field]: value }
  });
}

export async function deductHeart(uniqueCode: string) {
  await prisma.user.update({
    where: { uniqueCode },
    data: { hearts: { decrement: 1 } }
  });
}

export async function addXP(uniqueCode: string, amount: number) {
  await prisma.user.update({
    where: { uniqueCode },
    data: { xp: { increment: amount } }
  });
}

export async function addCrown(uniqueCode: string) {
  await prisma.user.update({
    where: { uniqueCode },
    data: { crowns: { increment: 1 } }
  });
}

export async function logScore(uniqueCode: string, chapterId: number, chapterTitle: string, activityType: string, score: number, maxScore: number) {
  const user = await prisma.user.findUnique({ where: { uniqueCode } });
  if (!user) return;

  await prisma.scoreLog.create({
    data: {
      userId: user.id,
      chapterId,
      chapterTitle,
      activityType,
      score,
      maxScore
    }
  });
}

export async function claimSpinReward(uniqueCode: string, result: { type: string, value: number }) {
  const user = await prisma.user.findUnique({ where: { uniqueCode } });
  if (!user) return;

  const data: any = { lastSpinTime: new Date() };
  if (result.type === 'HEART') {
    data.hearts = { increment: result.value };
  } else if (result.type === 'XP') {
    data.xp = { increment: result.value };
  }

  await prisma.user.update({
    where: { uniqueCode },
    data
  });
}

export async function purchaseItem(uniqueCode: string, itemName: string, price: number) {
  const user = await prisma.user.findUnique({ where: { uniqueCode } });
  if (!user) throw new Error("Not found");
  if (user.xp < price) throw new Error("Not enough XP");

  await prisma.user.update({
    where: { uniqueCode },
    data: {
      xp: { decrement: price },
      inventory: { push: itemName }
    }
  });
}

export async function getLeaderboard() {
  const users = await prisma.user.findMany({
    orderBy: { xp: 'desc' },
    take: 50,
  });
  return users.map(u => ({
    name: u.name,
    xp: u.xp,
    className: u.className
  }));
}

export async function getAllChapters() {
  const custom = await prisma.customChapter.findMany();

  // Build a map of builtinId -> custom override
  const overrides = new Map<number, any>();
  custom.forEach(c => {
    if (c.builtinId !== null && c.builtinId !== undefined) {
      overrides.set(c.builtinId, c);
    }
  });

  // Apply overrides on built-in chapters
  const builtins = chaptersData.map(ch => {
    const override = overrides.get(ch.id);
    if (override) {
      return {
        id: ch.id, // keep original id
        title: override.title,
        description: override.description,
        icon: override.icon,
        materi: override.materi as any,
        dhongeng: override.dhongeng as any,
        lkpd: override.lkpd as any,
        game: override.game as any,
        _customId: override.id, // store the custom DB id for edit reference
        _isOverride: true,
      };
    }
    return ch;
  });

  // Custom chapters that are NOT overrides (new chapters with id >= 1000)
  const newCustom = custom
    .filter(c => c.builtinId === null || c.builtinId === undefined)
    .map(c => ({
      id: c.id + 1000,
      title: c.title,
      description: c.description,
      icon: c.icon,
      materi: c.materi as any,
      dhongeng: c.dhongeng as any,
      lkpd: c.lkpd as any,
      game: c.game as any,
    }));

  return [...builtins, ...newCustom];
}

export async function addCustomChapter(data: any) {
  await prisma.customChapter.create({
    data: {
      title: data.title,
      description: data.description,
      icon: data.icon,
      materi: data.materi,
      dhongeng: data.dhongeng,
      lkpd: data.lkpd,
      game: data.game,
      builtinId: data.builtinId ?? null,
    }
  });
}

export async function updateCustomChapter(id: number, data: any) {
  await prisma.customChapter.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      icon: data.icon,
      materi: data.materi,
      dhongeng: data.dhongeng,
      lkpd: data.lkpd,
      game: data.game,
    }
  });
}

// Save or update a built-in chapter override
export async function upsertBuiltinOverride(builtinId: number, data: any) {
  await prisma.customChapter.upsert({
    where: { builtinId },
    update: {
      title: data.title,
      description: data.description,
      icon: data.icon,
      materi: data.materi,
      dhongeng: data.dhongeng,
      lkpd: data.lkpd,
      game: data.game,
    },
    create: {
      builtinId,
      title: data.title,
      description: data.description,
      icon: data.icon,
      materi: data.materi,
      dhongeng: data.dhongeng,
      lkpd: data.lkpd,
      game: data.game,
    },
  });
}

export async function deleteCustomChapter(id: number) {
  await prisma.customChapter.delete({ where: { id } });
}

export async function getScoreLogs() {
  const logs = await prisma.scoreLog.findMany({
    include: { user: true },
    orderBy: { timestamp: 'desc' }
  });
  return logs.map(l => ({
    studentName: l.user.name,
    studentClass: l.user.className,
    chapterId: l.chapterId,
    chapterTitle: l.chapterTitle,
    activityType: l.activityType,
    score: l.score,
    maxScore: l.maxScore,
    timestamp: l.timestamp.toISOString()
  }));
}

export async function getVisitorLogs() {
  const logs = await prisma.visitorLog.findMany({
    include: { user: true },
    orderBy: { timestamp: 'desc' }
  });
  return logs.map(l => ({
    name: l.user.name,
    className: l.user.className,
    timestamp: l.timestamp.toISOString()
  }));
}
