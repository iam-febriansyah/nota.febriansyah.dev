/* eslint-disable @typescript-eslint/no-explicit-any */
import ExcelJS from 'exceljs';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates an Excel buffer from data using exceljs (secure alternative to xlsx)
 */
export async function generateExcelBuffer(data: any[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Transactions');

  if (data.length > 0) {
    // Add columns based on the first object's keys
    const columns = Object.keys(data[0]).map(key => ({
      header: key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      key: key,
      width: 20
    }));
    worksheet.columns = columns;

    // Add rows
    worksheet.addRows(data);

    // Style the header row
    worksheet.getRow(1).font = { bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Generates a basic PDF of a transaction note
 */
export async function generateTransactionPDF(transaction: any) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 800]);
  const { height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const drawText = (text: string, x: number, y: number, size: number = 10, isBold: boolean = false) => {
    page.drawText(text, {
      x,
      y: height - y,
      size,
      font: isBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
  };

  // Header
  drawText('SINFONI - NOTA TRANSAKSI', 50, 50, 18, true);
  drawText(`Nomor Invoice: ${transaction.header.invoice_number}`, 50, 80);
  drawText(`Tanggal: ${new Date(transaction.header.created_at).toLocaleString()}`, 50, 95);
  drawText(`Dealer: ${transaction.header.dealer_name}`, 50, 110);
  if (transaction.header.promo_description) {
    drawText(`Promo: ${transaction.header.promo_description}`, 50, 125);
    drawText(`Status: ${transaction.header.status}`, 50, 140);
  } else {
    drawText(`Status: ${transaction.header.status}`, 50, 125);
  }

  // Items Table
  let yPos = 160;
  drawText('Barang', 50, yPos, 10, true);
  drawText('Qty', 300, yPos, 10, true);
  drawText('Harga Satuan', 380, yPos, 10, true);
  drawText('Subtotal', 480, yPos, 10, true);
  
  page.drawLine({
    start: { x: 50, y: height - (yPos + 5) },
    end: { x: 550, y: height - (yPos + 5) },
    thickness: 1,
  });

  yPos += 25;
  transaction.items.forEach((item: any) => {
    drawText(`${item.barang_name} (${item.barang_code})`, 50, yPos);
    drawText(item.qty.toString(), 300, yPos);
    drawText(new Intl.NumberFormat('id-ID').format(item.unit_price), 380, yPos);
    drawText(new Intl.NumberFormat('id-ID').format(item.subtotal), 480, yPos);
    yPos += 15;
  });

  page.drawLine({
    start: { x: 50, y: height - (yPos + 5) },
    end: { x: 550, y: height - (yPos + 5) },
    thickness: 1,
  });

  yPos += 20;
  yPos += 20;
  
  if (transaction.header.discount > 0) {
    drawText(`Subtotal: Rp ${new Intl.NumberFormat('id-ID').format(transaction.header.total_amount + Number(transaction.header.discount))}`, 400, yPos);
    yPos += 15;
    drawText(`Diskon: - Rp ${new Intl.NumberFormat('id-ID').format(transaction.header.discount)}`, 400, yPos);
    yPos += 20;
  }

  drawText(`TOTAL: Rp ${new Intl.NumberFormat('id-ID').format(transaction.header.total_amount)}`, 400, yPos, 12, true);

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
