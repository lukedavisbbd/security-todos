import { Router } from 'express';
import { getAllStatuses } from '../db/status-queries.js';

const router = Router();

/**
 * Get all available statuses
 */
router.get('/statuses', async (_req, res) => {
  const statuses = await getAllStatuses();
  res.json(statuses);
});

export default router;