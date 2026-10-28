import { Router } from 'express';
import { controller as c } from './hookwatch.controller.js';
export const router = Router();
router.get('/endpoints', c.endpoints);
router.post('/endpoints', c.createEndpoint);
router.get('/deliveries', c.list);
router.get('/deliveries/:id', c.get);
router.post('/deliveries', c.create);
router.post('/deliveries/:id/retry', c.retry);
router.post('/demo/receiver', (req, res) => {
  if (req.body?.data?.simulateFailure === true) {
    res.status(503).json({ error: 'Simüle edilmiş alıcı kesintisi.' });
    return;
  }
  res.json({ received: true });
});
