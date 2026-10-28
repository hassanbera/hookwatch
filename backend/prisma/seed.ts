import 'dotenv/config';
import { prisma as db } from '../src/config/database.js';
import { env } from '../src/config/env.js';

try {
  if (!(await db.endpoint.findFirst())) {
    const endpoint = await db.endpoint.create({
      data: {
        name: 'Yerel demo alıcısı',
        url: 'http://localhost:' + env.PORT + '/api/demo/receiver',
      },
    });
    await db.delivery.create({
      data: {
        endpointId: endpoint.id,
        eventType: 'project.created',
        payload: { project: 'Portfolyo', source: 'demo' },
      },
    });
    await db.delivery.create({
      data: {
        endpointId: endpoint.id,
        eventType: 'payment.received',
        payload: { amountCents: 250000, currency: 'TRY' },
      },
    });
  }
  console.log('HookWatch demo verisi hazır.');
} finally {
  await db.$disconnect();
}
