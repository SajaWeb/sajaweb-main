/* eslint-disable @typescript-eslint/no-explicit-any */
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type CompanyInfo = {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
};

const drawLogo = async (doc: any, page: any) => {
  const logoUrl = '/logo.png';
  const logoImage = await fetch(logoUrl).then(res => res.arrayBuffer());
  const logo = await doc.embedPng(logoImage);
  const logoDims = logo.scale(0.04);
  page.drawImage(logo, {
    x: page.getWidth() / 2 - logoDims.width / 2,
    y: page.getHeight() - logoDims.height - 15,
    width: logoDims.width,
    height: logoDims.height,
  });
  return logoDims.height + 25;
};

export const generatePDF = async (invoiceData: any, companyInfo: CompanyInfo) => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([226, 1000]);

  const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 9;
  const smallFontSize = 8;
  const titleFontSize = 11;
  let yPosition = 980;
  const leftMargin = 12;
  const rightMargin = 214;
  const lineSpacing = 3;

  // Draw logo
  yPosition -= await drawLogo(doc, page);

  const drawText = (text: string, options: any) => {
    const words = text.split(' ');
    let line = '';
    const maxWidth = rightMargin - options.x;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const testWidth = options.font.widthOfTextAtSize(testLine, options.size);
      if (testWidth > maxWidth && line !== '') {
        page.drawText(line.trim(), { ...options, y: yPosition });
        yPosition -= options.size + lineSpacing;
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      page.drawText(line.trim(), { ...options, y: yPosition });
      yPosition -= options.size + lineSpacing;
    }
  };

  const drawSeparator = (thickness = 0.5, padding = 8) => {
    yPosition -= padding;
    page.drawLine({
      start: { x: leftMargin, y: yPosition },
      end: { x: rightMargin, y: yPosition },
      thickness: thickness,
      color: rgb(0.7, 0.7, 0.7)
    });
    yPosition -= padding;
  };

  const drawBox = (height: number, bgColor = rgb(0.95, 0.95, 0.95)) => {
    page.drawRectangle({
      x: leftMargin,
      y: yPosition - height + 5,
      width: rightMargin - leftMargin,
      height: height,
      color: bgColor,
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 0.5,
    });
  };

  // Company Info Section
  drawText(companyInfo.name.toUpperCase(), {
    x: leftMargin,
    size: titleFontSize,
    font: helveticaBoldFont,
    color: rgb(0.2, 0.2, 0.2)
  });
  yPosition -= 2;
  
  drawText('Régimen Simplificado', {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3)
  });
  
  drawText('No somos responsables de IVA', {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3)
  });
  
  yPosition -= 3;
  drawText(`NIT: ${companyInfo.taxId}`, {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2)
  });
  
  drawText(`Email: ${companyInfo.email}`, {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2)
  });
  
  drawText(`Tel: ${companyInfo.phone}`, {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2)
  });

  drawSeparator(1, 12);

  // Invoice Number Section
  const boxHeight = 20;
  drawBox(boxHeight);
  yPosition -= 3;
  drawText(`FACTURA No: ${invoiceData.number}`, {
    x: leftMargin + 3,
    size: fontSize + 1,
    font: helveticaBoldFont,
    color: rgb(0.1, 0.1, 0.1)
  });
  yPosition -= 10;

  // Client Info Section
  drawText('INFORMACIÓN DEL CLIENTE', {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0.2, 0.2, 0.2)
  });
  yPosition -= 2;
  
  drawText(invoiceData.clientName, {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0.1, 0.1, 0.1)
  });
  
  drawText(`ID: ${invoiceData.clientTaxId}`, {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3)
  });
  
  drawText(`Dirección: ${invoiceData.clientAddress}`, {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3)
  });
  
  drawText(`Teléfono: ${invoiceData.clientPhone}`, {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.3, 0.3, 0.3)
  });

  drawSeparator(1, 12);

  // Items Section Header
  drawText('DETALLE DE PRODUCTOS/SERVICIOS', {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0.2, 0.2, 0.2)
  });
  
  drawSeparator(0.5, 6);

  // Items
  invoiceData.items.forEach((item: any, index: number) => {
    yPosition -= 2;
    
    drawText(item.name, {
      x: leftMargin,
      size: fontSize,
      font: helveticaBoldFont,
      color: rgb(0.1, 0.1, 0.1)
    });
    
    drawText(`Cantidad: ${item.quantity} × $${item.price.toLocaleString('es-CO')} = $${item.subtotal.toLocaleString('es-CO')}`, {
      x: leftMargin + 5,
      size: smallFontSize,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3)
    });
    
    if (item.discount > 0) {
      drawText(`Descuento aplicado: -$${item.discount.toLocaleString('es-CO')}`, {
        x: leftMargin + 5,
        size: smallFontSize,
        font: helveticaFont,
        color: rgb(0.8, 0.2, 0.2)
      });
    }
    
    if (index < invoiceData.items.length - 1) {
      yPosition -= 3;
      page.drawLine({
        start: { x: leftMargin + 5, y: yPosition },
        end: { x: rightMargin - 5, y: yPosition },
        thickness: 0.3,
        color: rgb(0.85, 0.85, 0.85),
        dashArray: [2, 2]
      });
      yPosition -= 5;
    }
  });

  yPosition -= 5;
  drawSeparator(1, 10);

  // Total Section
  const totalBoxHeight = 22;
  drawBox(totalBoxHeight, rgb(0.9, 0.9, 0.9));
  yPosition -= 4;
  
  drawText(`TOTAL A PAGAR: $${invoiceData.total.toLocaleString('es-CO')}`, {
    x: leftMargin + 3,
    size: fontSize + 2,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0)
  });
  yPosition -= 12;

  // Notes Section
  if (invoiceData.notes) {
    drawSeparator(0.5, 10);
    drawText('NOTAS', {
      x: leftMargin,
      size: fontSize,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 2;
    drawText(invoiceData.notes, {
      x: leftMargin,
      size: smallFontSize,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4)
    });
  }

  // Terms Section
  drawSeparator(0.5, 12);
  drawText('TÉRMINOS Y CONDICIONES', {
    x: leftMargin,
    size: smallFontSize,
    font: helveticaBoldFont,
    color: rgb(0.3, 0.3, 0.3)
  });
  yPosition -= 1;
  
  const terms = "Esta factura debe ser pagada en un plazo de 30 días. Pasado este tiempo, se aplicarán intereses de mora según la legislación vigente.";
  drawText(terms, {
    x: leftMargin,
    size: smallFontSize - 1,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5)
  });

  yPosition -= 8;
  page.drawLine({
    start: { x: leftMargin, y: yPosition },
    end: { x: rightMargin, y: yPosition },
    thickness: 0.3,
    color: rgb(0.8, 0.8, 0.8)
  });
  yPosition -= 8;
  
  drawText('Gracias por su preferencia', {
    x: page.getWidth() / 2 - helveticaFont.widthOfTextAtSize('Gracias por su preferencia', smallFontSize) / 2,
    size: smallFontSize,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5)
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
};