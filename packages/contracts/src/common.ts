import { z } from 'zod';

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof difficultySchema>;

export const itemTypeSchema = z.enum(['daily', 'todo', 'habit']);
export type ItemType = z.infer<typeof itemTypeSchema>;

export const idSchema = z.uuid();

/** Dia local do usuário, no formato AAAA-MM-DD (já calculado no fuso do perfil). */
export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Data inválida');
export type LocalDate = z.infer<typeof localDateSchema>;

/** Fuso IANA (ex.: America/Sao_Paulo). */
export const timezoneSchema = z.string().refine((value) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, 'Fuso horário inválido');

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

/** Dias da semana de 0 (domingo) a 6 (sábado), sem repetição. "Todo dia" = os 7 dias. */
export const scheduleDaysSchema = z
  .array(z.number().int().min(0).max(6))
  .min(1)
  .max(7)
  .refine((days) => new Set(days).size === days.length, 'Dias repetidos');
export type ScheduleDays = z.infer<typeof scheduleDaysSchema>;
