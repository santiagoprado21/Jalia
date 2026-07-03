import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Receta, Ingrediente, Cotizacion, VentaDiaria } from "@/types";
import { calcularPrecio } from "@/hooks/use-data";
import { formatSemana, getDiasSemana } from "@/lib/semana";

const NEGOCIO = "JALIA";

function formatMXN(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export function exportarPDF(recetas: Receta[], ingredientes: Ingrediente[]) {
  const doc = new jsPDF();
  const fecha = new Date().toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(60, 25, 10);
  doc.text(NEGOCIO, 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 80, 60);
  doc.text("Lista de precios de postres", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(160, 130, 110);
  doc.text(`Generado el ${fecha}`, 14, 34);

  const rows = recetas.map((r) => {
    const c = calcularPrecio(r, ingredientes);
    return [
      r.nombre,
      r.categoria,
      r.porciones.toString(),
      formatMXN(c.costoIngredientes),
      formatMXN(c.costoTotal - c.costoIngredientes),
      formatMXN(c.costoPorPorcion),
      `${r.margenGanancia}%`,
      formatMXN(c.precioVentaSugerido),
      formatMXN(c.gananciaTotal),
    ];
  });

  autoTable(doc, {
    startY: 42,
    head: [
      [
        "Postre",
        "Categoria",
        "Porciones",
        "Costo ing.",
        "Costos fijos",
        "Costo/porc.",
        "Margen",
        "Precio sugerido",
        "Ganancia total",
      ],
    ],
    body: rows,
    headStyles: {
      fillColor: [60, 25, 10],
      textColor: [255, 248, 240],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [40, 20, 10] },
    alternateRowStyles: { fillColor: [255, 248, 240] },
    styles: { cellPadding: 3 },
  });

  doc.save(`JALIA_precios_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportarExcel(recetas: Receta[], ingredientes: Ingrediente[]) {
  const filas = recetas.map((r) => {
    const c = calcularPrecio(r, ingredientes);
    return {
      Postre: r.nombre,
      Categoria: r.categoria,
      Porciones: r.porciones,
      "Costo ingredientes": c.costoIngredientes,
      "Costos fijos": c.costoTotal - c.costoIngredientes,
      "Costo total": c.costoTotal,
      "Costo por porcion": c.costoPorPorcion,
      "Margen (%)": r.margenGanancia,
      "Precio sugerido": c.precioVentaSugerido,
      "Ganancia total": c.gananciaTotal,
    };
  });

  const hoja = XLSX.utils.json_to_sheet(filas);

  const anchos = [
    { wch: 28 },
    { wch: 14 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 12 },
    { wch: 16 },
    { wch: 14 },
  ];
  hoja["!cols"] = anchos;

  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Precios JALIA");

  XLSX.writeFile(libro, `JALIA_precios_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportarCotizacionPDF(
  cotizacion: Cotizacion,
  recetas: Receta[],
  ingredientes: Ingrediente[]
) {
  const doc = new jsPDF();

  const fechaCreacion = new Date(cotizacion.fechaCreacion).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const fechaEntrega = cotizacion.fechaEntrega
    ? new Date(cotizacion.fechaEntrega + "T12:00:00").toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(60, 25, 10);
  doc.text(NEGOCIO, 14, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120, 80, 60);
  doc.text("Cotizacion de pedido", 14, 30);

  doc.setFontSize(9);
  doc.setTextColor(160, 130, 110);
  doc.text(`Fecha: ${fechaCreacion}`, 14, 37);

  // Client box
  doc.setDrawColor(220, 195, 175);
  doc.setFillColor(255, 248, 240);
  doc.roundedRect(14, 44, 182, fechaEntrega || cotizacion.notas ? 34 : 18, 3, 3, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(60, 25, 10);
  doc.text("Cliente:", 18, 52);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 20, 10);
  doc.text(cotizacion.nombreCliente, 38, 52);

  if (cotizacion.telefono) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 25, 10);
    doc.text("Tel:", 100, 52);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 20, 10);
    doc.text(cotizacion.telefono, 112, 52);
  }

  let infoY = 59;
  if (fechaEntrega) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 25, 10);
    doc.text("Entrega:", 18, infoY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 20, 10);
    doc.text(fechaEntrega, 40, infoY);
    infoY += 7;
  }

  if (cotizacion.notas) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(60, 25, 10);
    doc.text("Notas:", 18, infoY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 20, 10);
    const notasLines = doc.splitTextToSize(cotizacion.notas, 145);
    doc.text(notasLines, 40, infoY);
  }

  const startY = fechaEntrega || cotizacion.notas ? 84 : 70;

  // Items table
  const rows = cotizacion.items.map((item) => {
    const receta = recetas.find((r) => r.id === item.recetaId);
    if (!receta) return ["Postre no disponible", item.cantidad.toString(), "-", "-"];
    const calc = calcularPrecio(receta, ingredientes);
    return [
      receta.nombre,
      item.cantidad.toString(),
      formatMXN(calc.precioVentaSugerido),
      formatMXN(calc.precioVentaSugerido * item.cantidad),
    ];
  });

  const total = cotizacion.items.reduce((sum, item) => {
    const receta = recetas.find((r) => r.id === item.recetaId);
    if (!receta) return sum;
    const calc = calcularPrecio(receta, ingredientes);
    return sum + calc.precioVentaSugerido * item.cantidad;
  }, 0);

  autoTable(doc, {
    startY,
    head: [["Postre", "Cantidad", "Precio unitario", "Subtotal"]],
    body: rows,
    foot: [["", "", "TOTAL", formatMXN(total)]],
    headStyles: {
      fillColor: [60, 25, 10],
      textColor: [255, 248, 240],
      fontStyle: "bold",
      fontSize: 9,
    },
    bodyStyles: { fontSize: 9, textColor: [40, 20, 10] },
    footStyles: {
      fillColor: [255, 240, 225],
      textColor: [60, 25, 10],
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: [255, 250, 245] },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "right", cellWidth: 38 },
      3: { halign: "right", cellWidth: 38 },
    },
    styles: { cellPadding: 4 },
  });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(180, 150, 130);
  doc.text(`${NEGOCIO} — gracias por tu preferencia`, 14, pageH - 10);

  doc.save(`JALIA_cotizacion_${cotizacion.nombreCliente.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportarCuadreSemanalPDF(
  lunesISO: string,
  ventas: VentaDiaria[],
  recetas: Receta[],
  ingredientes: Ingrediente[]
) {
  const doc = new jsPDF();
  const dias = getDiasSemana(lunesISO);
  const DIAS_NOMBRES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

  function totalesDia(fecha: string) {
    const venta = ventas.find((v) => v.fecha === fecha);
    if (!venta || venta.items.length === 0) return { ingresos: 0, costos: 0, ganancia: 0, unidades: 0, items: [] };
    let ingresos = 0, costos = 0, unidades = 0;
    venta.items.forEach((item) => {
      const receta = recetas.find((r) => r.id === item.recetaId);
      ingresos += item.precioVenta * item.cantidad;
      unidades += item.cantidad;
      if (receta) costos += calcularPrecio(receta, ingredientes).costoPorPorcion * item.cantidad;
    });
    return { ingresos, costos, ganancia: ingresos - costos, unidades, items: venta.items };
  }

  const totalSemana = dias.reduce(
    (acc, f) => { const t = totalesDia(f); return { ingresos: acc.ingresos + t.ingresos, costos: acc.costos + t.costos, ganancia: acc.ganancia + t.ganancia, unidades: acc.unidades + t.unidades }; },
    { ingresos: 0, costos: 0, ganancia: 0, unidades: 0 }
  );

  // --- Header ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(60, 25, 10);
  doc.text(NEGOCIO, 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(120, 80, 60);
  doc.text("Cuadre de Caja Semanal", 14, 28);

  doc.setFontSize(9);
  doc.setTextColor(160, 130, 110);
  doc.text(`Semana: ${formatSemana(lunesISO)}`, 14, 35);
  doc.text(`Generado el ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}`, 14, 41);

  // --- Summary box ---
  doc.setDrawColor(220, 195, 175);
  doc.setFillColor(255, 248, 240);
  doc.roundedRect(14, 47, 182, 28, 3, 3, "FD");

  const summaryItems = [
    { label: "Ingresos", value: formatMXN(totalSemana.ingresos) },
    { label: "Costos est.", value: formatMXN(totalSemana.costos) },
    { label: "Ganancia", value: formatMXN(totalSemana.ganancia) },
    { label: "Unidades", value: totalSemana.unidades.toString() },
    { label: "Margen", value: totalSemana.ingresos > 0 ? `${Math.round((totalSemana.ganancia / totalSemana.ingresos) * 100)}%` : "—" },
  ];
  const colW = 182 / summaryItems.length;
  summaryItems.forEach(({ label, value }, i) => {
    const x = 14 + i * colW + colW / 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(140, 100, 80);
    doc.text(label, x, 56, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(60, 25, 10);
    doc.text(value, x, 63, { align: "center" });
  });

  // --- Daily table ---
  const rowsDias = dias.map((fecha, i) => {
    const t = totalesDia(fecha);
    const d = new Date(fecha + "T12:00:00");
    const fechaStr = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    return [
      `${DIAS_NOMBRES[i]} ${fechaStr}`,
      t.unidades > 0 ? t.unidades.toString() : "—",
      t.ingresos > 0 ? formatMXN(t.ingresos) : "—",
      t.costos > 0 ? formatMXN(t.costos) : "—",
      t.ganancia > 0 ? formatMXN(t.ganancia) : "—",
    ];
  });

  autoTable(doc, {
    startY: 82,
    head: [["Día", "Unidades", "Ingresos", "Costos est.", "Ganancia"]],
    body: rowsDias,
    foot: [["TOTAL SEMANA", totalSemana.unidades.toString(), formatMXN(totalSemana.ingresos), formatMXN(totalSemana.costos), formatMXN(totalSemana.ganancia)]],
    headStyles: { fillColor: [60, 25, 10], textColor: [255, 248, 240], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 20, 10] },
    footStyles: { fillColor: [255, 240, 225], textColor: [60, 25, 10], fontStyle: "bold", fontSize: 9 },
    alternateRowStyles: { fillColor: [255, 250, 245] },
    columnStyles: {
      0: { cellWidth: 52 },
      1: { halign: "center", cellWidth: 26 },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    styles: { cellPadding: 3.5 },
  });

  // --- Best sellers ---
  const ventasMap: Record<string, { nombre: string; unidades: number; ingresos: number; costos: number }> = {};
  ventas.filter((v) => dias.includes(v.fecha)).forEach((v) => {
    v.items.forEach((item) => {
      const receta = recetas.find((r) => r.id === item.recetaId);
      if (!receta) return;
      if (!ventasMap[item.recetaId]) ventasMap[item.recetaId] = { nombre: receta.nombre, unidades: 0, ingresos: 0, costos: 0 };
      ventasMap[item.recetaId].unidades += item.cantidad;
      ventasMap[item.recetaId].ingresos += item.precioVenta * item.cantidad;
      ventasMap[item.recetaId].costos += calcularPrecio(receta, ingredientes).costoPorPorcion * item.cantidad;
    });
  });

  const mejores = Object.values(ventasMap).sort((a, b) => b.ingresos - a.ingresos);

  if (mejores.length > 0) {
    const lastTable = (doc as any).lastAutoTable;
    const startY2 = lastTable ? lastTable.finalY + 10 : 180;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(60, 25, 10);
    doc.text("Productos vendidos", 14, startY2);

    autoTable(doc, {
      startY: startY2 + 4,
      head: [["Postre", "Unidades", "Ingresos", "Costos est.", "Ganancia"]],
      body: mejores.map((p) => [p.nombre, p.unidades.toString(), formatMXN(p.ingresos), formatMXN(p.costos), formatMXN(p.ingresos - p.costos)]),
      headStyles: { fillColor: [90, 45, 20], textColor: [255, 248, 240], fontStyle: "bold", fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [40, 20, 10] },
      alternateRowStyles: { fillColor: [255, 250, 245] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "center", cellWidth: 26 },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      styles: { cellPadding: 3.5 },
    });
  }

  // --- Footer ---
  const pageH = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(180, 150, 130);
  doc.text(`${NEGOCIO} — Cuadre de caja semanal`, 14, pageH - 10);

  doc.save(`JALIA_cuadre_${lunesISO}.pdf`);
}
