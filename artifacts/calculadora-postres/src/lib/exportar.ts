import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { Receta, Ingrediente } from "@/types";
import { calcularPrecio } from "@/hooks/use-data";

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
