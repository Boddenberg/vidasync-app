import type { WaterEvent } from '@/services/water';
import { MONTHS } from '@/utils/helpers';

export function getCalendarRows(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(day);
  }
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows: (number | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    rows.push(cells.slice(index, index + 7));
  }

  return rows;
}

export function dayHeading(date: string): string {
  const [year, month, day] = date.split('-').map((item) => parseInt(item, 10));
  return `${day} de ${MONTHS[month - 1]} de ${year}`;
}

export function formatWaterLiters(valueMl: number): string {
  return `${(valueMl / 1000).toFixed(1)}L`;
}

export function formatWaterEventTime(event: WaterEvent): string {
  if (!event.createdAt) return 'Horário não informado';

  const parsed = new Date(event.createdAt);
  if (Number.isNaN(parsed.getTime())) return 'Horário não informado';

  return parsed.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}
