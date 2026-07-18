/**
 * Database seed script — creates the three initial integrations for the MVP.
 *
 * Run with: npm run db:seed
 * Or: npx ts-node prisma/seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding FlowSync integrations...');

  // ── REST Integration (RandomUser API) ─────────────────────────────────────
  const restIntegration = await prisma.integration.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'RandomUser REST API',
      type: 'rest',
      status: 'active',
      baseUrl: 'https://randomuser.me/api/',
    },
  });

  // ── FHIR Integration (HAPI FHIR R4) ──────────────────────────────────────
  const fhirIntegration = await prisma.integration.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      name: 'HAPI FHIR R4 Sandbox',
      type: 'fhir',
      status: 'active',
      baseUrl: 'https://hapi.fhir.org/baseR4',
    },
  });

  // ── Messaging Integration (Resend) ─────────────────────────────────────────
  const messagingIntegration = await prisma.integration.upsert({
    where: { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      name: 'Resend Email Notifications',
      type: 'messaging',
      status: 'active',
    },
  });

  // ── Webhook Integration (Mock) ─────────────────────────────────────────────
  const mockWebhook = await prisma.integration.upsert({
    where: { id: '00000000-0000-0000-0000-000000000004' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      name: 'Mock Webhook Provider',
      type: 'mock',
      status: 'active',
    },
  });

  console.log('✅ Seeded integrations:');
  console.log(` - [REST]      ${restIntegration.name} (${restIntegration.id})`);
  console.log(` - [FHIR]      ${fhirIntegration.name} (${fhirIntegration.id})`);
  console.log(` - [Messaging] ${messagingIntegration.name} (${messagingIntegration.id})`);
  console.log(` - [Webhook]   ${mockWebhook.name} (${mockWebhook.id})`);
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
