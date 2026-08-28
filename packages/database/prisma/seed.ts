import { PrismaClient, Role } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.upsert({ where: { email: "demo@socialops.local" }, update: {}, create: { name: "Demo Operator", email: "demo@socialops.local", passwordHash: "DEMO_ONLY_NOT_A_PASSWORD", role: Role.OWNER } });
  const org = await prisma.organization.create({ data: { name: "Demo Workspace", members: { create: { userId: user.id, role: Role.OWNER } } } });
  await prisma.campusProfile.create({ data: { organizationId: org.id, name: "Demo Campus", shortName: "DEMO", location: "Configure location", tone: "Professional", targetAudience: "Community", brandGuidelines: "Demo data only" } });
}
main().finally(() => prisma.$disconnect());
