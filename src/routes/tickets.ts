import { Router } from 'express';
import {
  createTicket,
  getAllTickets,
  getTicketById,
  updateTicketStatus,
} from '../dal/tickets.js';
import authMiddleware from '../middleware/auth.js';
import { getTotalHoursForTicket, insertTimeLog } from '../dal/timeLogs.js';

const router = Router();

const validStatuses = new Set(['TODO', 'IN_PROGRESS', 'DONE']);

function parseInteger(value: string, minimum: number): number | undefined {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < minimum) {
    return undefined;
  }

  return parsed;
}

// GET /tickets
router.get('/', async (req, res) => {
  const { limit, offset, status } = req.query;

  if (limit !== undefined && typeof limit !== 'string') {
    res.status(400).json({ error: 'limit must be a positive integer' });
    return;
  }

  if (offset !== undefined && typeof offset !== 'string') {
    res.status(400).json({ error: 'offset must be a non-negative integer' });
    return;
  }

  if (status !== undefined && typeof status !== 'string') {
    res.status(400).json({ error: 'status must be a string' });
    return;
  }

  const parsedLimit = limit === undefined ? undefined : parseInteger(limit, 1);
  const parsedOffset =
    offset === undefined ? undefined : parseInteger(offset, 0);

  if (limit !== undefined && parsedLimit === undefined) {
    res.status(400).json({ error: 'limit must be a positive integer' });
    return;
  }

  if (offset !== undefined && parsedOffset === undefined) {
    res.status(400).json({ error: 'offset must be a non-negative integer' });
    return;
  }

  if (status !== undefined && !validStatuses.has(status)) {
    res.status(400).json({ error: 'Invalid ticket status' });
    return;
  }

  try {
    const tickets = await getAllTickets({
      limit: parsedLimit,
      offset: parsedOffset,
      status,
    });
    res.status(200).json(tickets);
  } catch {
    res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

// GET /tickets/:id
router.get('/:id', async (req, res) => {
  const id = parseInteger(req.params.id, 1);

  if (id === undefined) {
    res.status(400).json({ error: 'Ticket ID must be a positive integer' });
    return;
  }

  try {
    const ticket = await getTicketById(id);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.status(200).json(ticket);
  } catch {
    res.status(500).json({ error: 'Failed to retrieve ticket' });
  }
});

// POST /tickets
router.post('/', authMiddleware, async (req, res) => {
  const { title, description } = req.body as {
    title?: unknown;
    description?: unknown;
  };

  if (typeof title !== 'string' || title.trim().length === 0) {
    res.status(400).json({ error: 'title is required and must be a string' });
    return;
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== 'string'
  ) {
    res.status(400).json({ error: 'description must be a string or null' });
    return;
  }

  try {
    const ticket = await createTicket({
      title: title.trim(),
      description: description ?? null,
      creator_id: res.locals.userId as number,
      assignee_id: null,
    });
    res.status(201).json(ticket);
  } catch {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// PATCH /tickets/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  const id = parseInteger(req.params.id, 1);
  const { status } = req.body as { status?: unknown };

  if (id === undefined) {
    res.status(400).json({ error: 'Ticket ID must be a positive integer' });
    return;
  }

  if (typeof status !== 'string' || !validStatuses.has(status)) {
    res.status(400).json({ error: 'Invalid ticket status' });
    return;
  }

  try {
    const ticket = await updateTicketStatus(id, status);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    res.status(200).json(ticket);
  } catch {
    res.status(500).json({ error: 'Failed to update ticket status' });
  }
});

// POST /tickets/:id/time
router.post('/:id/time', authMiddleware, async (req, res) => {
  const ticketId = parseInteger(req.params.id, 1);
  const userId = res.locals.userId as number;
  const { hours } = req.body as { hours?: unknown };

  if (ticketId === undefined) {
    res.status(400).json({
      error: 'Ticket ID must be a positive integer',
    });
    return;
  }

  if (typeof hours !== 'number' || !Number.isInteger(hours) || hours <= 0) {
    res.status(400).json({
      error: 'hours must be a positive integer',
    });
    return;
  }

  try {
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const timeLog = await insertTimeLog(ticketId, userId, hours);

    res.status(201).json(timeLog);
  } catch {
    res.status(500).json({ error: 'Failed to log time' });
  }
});

// GET /tickets/:id/time
router.get('/:id/time', async (req, res) => {
  const ticketId = parseInteger(req.params.id, 1);

  if (ticketId === undefined) {
    res.status(400).json({
      error: 'Ticket ID must be a positive integer',
    });
    return;
  }

  try {
    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found' });
      return;
    }

    const totalHours = await getTotalHoursForTicket(ticketId);

    res.status(200).json({
      ticket_id: ticketId,
      total_hours: totalHours,
    });
  } catch {
    res.status(500).json({ error: 'Failed to retrieve total hours' });
  }
});

export default router;
