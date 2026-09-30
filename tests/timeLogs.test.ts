import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';

describe('Part 2: Time Logs Tests', () => {
  it('adds multiple time logs and returns their total hours', async () => {
    const userResponse = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({
        name: 'Time Logger',
        email: 'time.logger@example.com',
      });

    expect(userResponse.status).toBe(201);

    const userId = userResponse.body.id;
    const ticketResponse = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({
        title: 'Time Log Test Ticket',
        description: 'Used to test time totals',
      });

    expect(ticketResponse.status).toBe(201);

    const ticketId = ticketResponse.body.id;
    const firstLogResponse = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({ hours: 2 });
    const secondLogResponse = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({ hours: 3 });

    expect(firstLogResponse.status).toBe(201);
    expect(secondLogResponse.status).toBe(201);

    const totalResponse = await request(app).get(`/tickets/${ticketId}/time`);

    expect(totalResponse.status).toBe(200);
    expect(totalResponse.body).toEqual({
      ticket_id: ticketId,
      total_hours: 5,
    });
  });
});
