export function getLunesDeSemana(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatFecha(iso: string): string {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function formatSemana(lunesISO: string): string {
  const lunes = new Date(lunesISO + "T12:00:00");
  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short" };
  return `${lunes.toLocaleDateString("es-MX", opts)} – ${domingo.toLocaleDateString("es-MX", opts)}`;
}

export function getDiasSemana(lunesISO: string): string[] {
  const lunes = new Date(lunesISO + "T12:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + i);
    return toISODate(d);
  });
}

export function getSemanas(ventas: { fecha: string }[]): string[] {
  const lunesSet = new Set<string>();
  ventas.forEach((v) => {
    const d = new Date(v.fecha + "T12:00:00");
    lunesSet.add(toISODate(getLunesDeSemana(d)));
  });
  const hoy = new Date();
  lunesSet.add(toISODate(getLunesDeSemana(hoy)));
  return Array.from(lunesSet).sort((a, b) => b.localeCompare(a));
}
