// TODO: Student implementation - Part 2: DAL for time logs

import { db, NewTimeLog, TimeLog } from '../db/database.js';

export async function insertTimeLog(
  ticketId: number,
  userId: number,
  hours: number,
): Promise<TimeLog> {
  const newTimeLog: NewTimeLog = {
    ticket_id: ticketId,
    user_id: userId,
    hours,
  };

  return await db
    .insertInto('time_logs')
    .values(newTimeLog)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getTotalHoursForTicket(
  ticketId: number,
): Promise<number> {
  const result = await db
    .selectFrom('time_logs')
    .select((eb) => eb.fn.sum<number>('hours').as('total_hours'))
    .where('ticket_id', '=', ticketId)
    .executeTakeFirst();

  if (!result || result.total_hours === null) {
    return 0;
  }

  const totalHours = Number(result.total_hours);

  return totalHours;
}
