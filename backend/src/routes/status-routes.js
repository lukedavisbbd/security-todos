import { Router } from 'express';
import { getAllStatuses } from '../db/status-queries.js';
import { authenticated } from '../middleware/auth-middleware.js';

const router = Router();

/**
 * Get all available statuses
 * @param {import('../index.js').AuthenticatedRequest} req 
 * @param {import('express').Response} res 
 */
router.get('/statuses', async (req, res) => {
  const statuses = await getAllStatuses();
  res.json(statuses);
});

export default router;