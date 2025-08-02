import PDFDocument from "pdfkit";

/**
 * Generate a PDF buffer for the Dinar Exchange order receipt.
 * @param {Object} order - The order object (with address, items, totals, etc).
 * @param {Object} companyInfo - Company and payment info.
 * @returns {Promise<Buffer>} Resolves to a Buffer containing the PDF data.
 */
export function generateInvoicePdfBuffer(order, companyInfo) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 36 });
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // Title
      doc.fontSize(22).text('Dinar Exchange - Order Receipt', { align: 'center' });
      doc.moveDown();

      // Order Meta
      doc.fontSize(11)
        .text(`Order #: ${order._id || "—"}`)
        .text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}`)
        .moveDown();

      // Shipping Info
      doc.fontSize(13).text('Ship To:', { underline: true });
      doc.fontSize(11)
        .text(order.fullName || '')
        .text(order.address || '')
        .text(
          [
            order.city,
            order.state,
            order.country,
            order.postcode,
          ].filter(Boolean).join(', ')
        )
        .moveDown();

      // Order Details
      doc.fontSize(13).text('Order Details:', { underline: true });
      doc.fontSize(11)
        .text(`Product: ${order.productName || "Uncirculated Iraqi Dinar 25k"}`)
        .text(`Quantity: ${order.quantity ?? 1}`)
        .text(`Subtotal: $${order.subtotal?.toFixed(2) ?? "0.00"} AUD`)
        .text(`Shipping: $${order.shippingCost?.toFixed(2) ?? "0.00"} AUD`)
        .text(`Total: $${order.totalAmount?.toFixed(2) ?? "0.00"} AUD`)
        .text(`Status: ${order.status || "Pending"}`)
        .moveDown();

      // Payment Info
      doc.fontSize(13).text('Payment Details:', { underline: true });
      doc.fontSize(11)
        .text(`Bank: ${companyInfo.bankName || ""}`)
        .text(`BSB: ${companyInfo.bsb || ""}`)
        .text(`Account Number: ${companyInfo.accountNumber || ""}`)
        .moveDown();

      // Footer (company info)
      doc
        .moveDown(2)
        .fontSize(10)
        .text(companyInfo.addressLine || "", { align: 'center' })
        .moveDown()
        .text(companyInfo.legalNotice || "", { align: 'center', width: 420 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
