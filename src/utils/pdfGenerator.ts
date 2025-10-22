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
  const logoDims = logo.scale(0.035);
  page.drawImage(logo, {
    x: page.getWidth() / 2 - logoDims.width / 2,
    y: page.getHeight() - logoDims.height - 12,
    width: logoDims.width,
    height: logoDims.height,
  });
  return logoDims.height + 18;
};

export const generatePDF = async (invoiceData: any, companyInfo: CompanyInfo) => {
  const doc = await PDFDocument.create();
  // 80mm = 226.77 points, usando 220 para márgenes seguros
  const page = doc.addPage([220, 1000]);

  const helveticaFont = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const fontSize = 8;
  const titleFontSize = 10;
  const mediumFontSize = 9;
  let yPosition = 980;
  const leftMargin = 8;
  const rightMargin = 212;
  const maxWidth = rightMargin - leftMargin;

  // Draw logo
  yPosition -= await drawLogo(doc, page);

  const drawText = (text: string, options: any) => {
    const words = text.split(' ');
    let line = '';
    const availableWidth = options.maxWidth || maxWidth;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const testWidth = options.font.widthOfTextAtSize(testLine, options.size);
      if (testWidth > availableWidth && line !== '') {
        page.drawText(line.trim(), { ...options, y: yPosition });
        yPosition -= options.size + 2;
        line = word + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) {
      page.drawText(line.trim(), { ...options, y: yPosition });
      yPosition -= options.size + 2;
    }
  };

  const drawSeparator = (thickness = 0.5, padding = 6) => {
    yPosition -= padding;
    page.drawLine({
      start: { x: leftMargin, y: yPosition },
      end: { x: rightMargin, y: yPosition },
      thickness: thickness,
      color: rgb(0.6, 0.6, 0.6)
    });
    yPosition -= padding;
  };

  const drawBox = (height: number) => {
    page.drawRectangle({
      x: leftMargin,
      y: yPosition - height + 4,
      width: maxWidth,
      height: height,
      color: rgb(0.92, 0.92, 0.92),
      borderColor: rgb(0.7, 0.7, 0.7),
      borderWidth: 0.5,
    });
  };

  // Company Info Section
  drawText(companyInfo.name.toUpperCase(), {
    x: leftMargin,
    size: titleFontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawText('Régimen Simplificado', {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawText('No somos responsables de IVA', {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  yPosition -= 1;
  drawText(`NIT: ${companyInfo.taxId}`, {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawText(`Email: ${companyInfo.email}`, {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawText(`Tel: ${companyInfo.phone}`, {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });

  drawSeparator(1, 8);

  // Invoice Number Section
  const boxHeight = 16;
  drawBox(boxHeight);
  yPosition -= 2;
  drawText(`FACTURA No: ${invoiceData.number}`, {
    x: leftMargin + 2,
    size: mediumFontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth - 4
  });
  yPosition -= 8;

  // Client Info Section
  drawText('CLIENTE', {
    x: leftMargin,
    size: mediumFontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawText(invoiceData.clientName, {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawText(`ID: ${invoiceData.clientTaxId}`, {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawText(`Dir: ${invoiceData.clientAddress}`, {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawText(`Tel: ${invoiceData.clientPhone}`, {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });

  drawSeparator(1, 8);

  // Items Section Header
  drawText('DESCRIPCIÓN', {
    x: leftMargin,
    size: mediumFontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth
  });
  
  drawSeparator(0.5, 4);

  // Items
  invoiceData.items.forEach((item: any, index: number) => {
    yPosition -= 1;
    
    drawText(item.name, {
      x: leftMargin,
      size: fontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
      maxWidth: maxWidth
    });
    
    const itemDetail = `${item.quantity} x ${item.price.toLocaleString('es-CO')} = ${item.subtotal.toLocaleString('es-CO')}`;
    drawText(itemDetail, {
      x: leftMargin + 3,
      size: fontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
      maxWidth: maxWidth - 3
    });
    
    if (item.discount > 0) {
      drawText(`Desc: -${item.discount.toLocaleString('es-CO')}`, {
        x: leftMargin + 3,
        size: fontSize,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
        maxWidth: maxWidth - 3
      });
    }
    
    if (index < invoiceData.items.length - 1) {
      yPosition -= 2;
      page.drawLine({
        start: { x: leftMargin + 3, y: yPosition },
        end: { x: rightMargin - 3, y: yPosition },
        thickness: 0.3,
        color: rgb(0.8, 0.8, 0.8),
        dashArray: [1, 1]
      });
      yPosition -= 3;
    }
  });

  yPosition -= 3;
  drawSeparator(1, 6);

  // Total Section
  const totalBoxHeight = 18;
  drawBox(totalBoxHeight);
  yPosition -= 3;
  
  drawText(`TOTAL: $${invoiceData.total.toLocaleString('es-CO')}`, {
    x: leftMargin + 2,
    size: titleFontSize,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: maxWidth - 4
  });
  yPosition -= 10;

  // Notes Section
  if (invoiceData.notes) {
    drawSeparator(0.5, 6);
    drawText('NOTAS', {
      x: leftMargin,
      size: mediumFontSize,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
      maxWidth: maxWidth
    });
    yPosition -= 1;
    drawText(invoiceData.notes, {
      x: leftMargin,
      size: fontSize,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
      maxWidth: maxWidth
    });
  }

  // Terms Section
  drawSeparator(0.5, 8);
  drawText('TÉRMINOS Y CONDICIONES', {
    x: leftMargin,
    size: fontSize,
    font: helveticaBoldFont,
    color: rgb(0.2, 0.2, 0.2),
    maxWidth: maxWidth
  });
  
  const terms = "Esta factura debe ser pagada en un plazo de 30 días. Pasado este tiempo, se aplicarán intereses de mora.";
  drawText(terms, {
    x: leftMargin,
    size: fontSize - 1,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
    maxWidth: maxWidth
  });

  yPosition -= 6;
  page.drawLine({
    start: { x: leftMargin, y: yPosition },
    end: { x: rightMargin, y: yPosition },
    thickness: 0.3,
    color: rgb(0.7, 0.7, 0.7)
  });
  yPosition -= 6;
  
  const thanksText = 'Gracias por su preferencia';
  const thanksWidth = helveticaFont.widthOfTextAtSize(thanksText, fontSize);
  drawText(thanksText, {
    x: (page.getWidth() - thanksWidth) / 2,
    size: fontSize,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
    maxWidth: maxWidth
  });

  const pdfBytes = await doc.save();
  return pdfBytes;
};