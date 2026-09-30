import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 1: Tests', () => {
  async function createTestUser() {
    return request(app).post('/users').set('X-User-Id', '1').send({
      name: 'Test User',
      email: 'test@example.com',
    });
  }

  it('creates a user', async () => {
    const response = await createTestUser();

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Test User');
    expect(response.body.email).toBe('test@example.com');
  });

  it('creates a ticket', async () => {
    const userResponse = await createTestUser();

    const response = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userResponse.body.id))
      .send({
        title: 'Test Ticket',
        description: 'A ticket created by the test',
      });

    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Ticket');
    expect(response.body.creator_id).toBe(userResponse.body.id);
  });

  it('rejects a ticket without authentication', async () => {
    const response = await request(app).post('/tickets').send({
      title: 'Unauthorized Ticket',
      description: 'This request has no X-User-Id header',
    });

    expect(response.status).toBe(401);
  });

  it('returns 404 for a user that does not exist', async () => {
    const response = await request(app).get('/users/999');

    expect(response.status).toBe(404);
  });

  it('paginates tickets', async () => {
    const userResponse = await createTestUser();
    const userId = String(userResponse.body.id);

    await request(app)
      .post('/tickets')
      .set('X-User-Id', userId)
      .send({ title: 'First Ticket' });
    await request(app)
      .post('/tickets')
      .set('X-User-Id', userId)
      .send({ title: 'Second Ticket' });

    const response = await request(app).get('/tickets?limit=1&offset=1');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Second Ticket');
  });
});
