import type { LocalDate } from '@nextjourney/contracts';

/**
 * Datas locais (AAAA-MM-DD) sem relógio implícito: tudo recebe a data como argumento.
 * A aritmética usa UTC só como calendário; não há fuso envolvido aqui.
 */
function toUtcDate(date: LocalDate): Date {
  return new Date(`${date}T00:00:00Z`);
}

function toLocalDate(date: Date): LocalDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  const result = toUtcDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return toLocalDate(result);
}

/** 0 = domingo ... 6 = sábado. */
export function diaDaSemana(date: LocalDate): number {
  return toUtcDate(date).getUTCDay();
}

/**
 * Dia local do usuário para um instante, no fuso IANA do perfil (virada às 00:00 nesse fuso).
 * Recebe o instante como argumento: nunca lê o relógio. Lança RangeError se o fuso for inválido.
 */
export function diaLocal(instante: Date | number | string, timezone: string): LocalDate {
  const date = instante instanceof Date ? instante : new Date(instante);
  if (Number.isNaN(date.getTime())) throw new RangeError('Instante inválido');
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
