import express from 'express';
import { globalSearch } from '../controllers/search.controller.js';

const router = express.Router();

// GET /api/search?q=...
router.get('/', globalSearch);

export default router;
