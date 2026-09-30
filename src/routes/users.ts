import { Router } from 'express';
import { createUser, getAllUsers, getUserById } from '../dal/users.js';
import authMiddleware from '../middleware/auth.js';

const router = Router();

// TODO: Student implementation - Part 1: User Routes
// GET /users
router.get('/', async (req, res) => {
  const users = await getAllUsers();
  res.status(200).json(users);
});

// GET /users/:id
router.get('/:id', async (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({
      error: 'User ID must be a positive integer',
    });
    return;
  }

  const user = await getUserById(userId);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.status(200).json(user);
});
// POST /users
router.post('/', authMiddleware, async (req, res) => {
  const { name, email } = req.body as {
    name?: unknown;
    email?: unknown;
  };

  if (typeof name !== 'string' || name.trim() === '') {
    res.status(400).json({ error: 'name is required' });
    return;
  }

  if (typeof email !== 'string' || email.trim() === '') {
    res.status(400).json({ error: 'email is required' });
    return;
  }

  try {
    const user = await createUser({
      name: name.trim(),
      email: email.trim(),
    });

    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
