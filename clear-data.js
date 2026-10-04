const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    console.log("Deleting ScoreLogs...");
    await prisma.scoreLog.deleteMany();
    console.log("Deleting VisitorLogs...");
    await prisma.visitorLog.deleteMany();
    console.log("Deleting ChapterProgress...");
    await prisma.chapterProgress.deleteMany();
    console.log("Deleting Users...");
    await prisma.user.deleteMany();
    console.log("Deleting Custom Chapters...");
    await prisma.customChapter.deleteMany();
    console.log("All data cleared successfully.");
  } catch (e) {
    console.error("DB Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
