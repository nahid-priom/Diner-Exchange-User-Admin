// utils/orderConfirmationEmail.js

export function generateOrderConfirmationEmail({
  order,
  paymentInfo,
  loginUrl,
  username,
  password,
  company,
  contact,
  links,
}) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background: #f8fafc; max-width: 700px; margin: 0 auto; padding: 28px 22px; border-radius: 16px; border: 1px solid #e0e7ef;">
    <h2 style="color: #4F46E5;">Order Confirmation – DinarExchange.com.au</h2>
    <p>Dear <b>${order.fullName}</b>,</p>
    <p>Thank you for ordering from <b>DinarExchange.com.au</b>!</p>
    <p style="margin-bottom:4px;"><b>Your Order Reference:</b> ${order._id || order.orderId || ""}</p>
    <p style="margin-bottom:4px;"><b>Payment Method:</b> ${order.paymentMethod || "Bank Transfer"}</p>
    <p>
      <b>Bank Transfer Details:</b><br>
      <b>Account Name:</b> ${company.fullName}<br>
      <b>Bank:</b> ${paymentInfo.bankName}<br>
      <b>BSB:</b> ${paymentInfo.bsb}<br>
      <b>Account Number:</b> ${paymentInfo.accountNumber}<br>
      <span style="color:#e11d48; font-weight:bold;">Please include your FULL NAME in the reference of your bank transfer.</span>
    </p>
    <p>
      Please upload your payment receipt by logging into your My Account Area:<br>
      <a href="${loginUrl}" style="color: #4F46E5;">${loginUrl}</a><br>
      <span>Username: <b>${username}</b></span><br>
      <span>Password: <b>${password}</b></span>
    </p>
    <hr style="margin: 18px 0;" />
    <div style="background: #f3f4f6; border-radius: 8px; padding: 20px;">
      <strong>Order Details:</strong><br>
      Product: <b>${order.productName || "Uncirculated Iraqi Dinar 25k"}</b><br>
      Quantity: <b>${order.quantity} Dinar</b><br>
      Subtotal: <b>$${order.subtotal?.toFixed(2) ?? "0.00"} AUD</b><br>
      Shipping: <b>$${order.shippingCost?.toFixed(2) ?? "0.00"} AUD</b><br>
      <span style="font-size:16px; color:#334155;">Total Amount: <b>$${order.totalAmount?.toFixed(2) ?? "0.00"} AUD</b></span><br>
      Payment Status: <b>${order.status || "Pending"}</b><br>
      <br>
      <strong>Shipping Address:</strong><br>
      ${order.fullName}<br>
      ${order.address}${order.address2 ? ', ' + order.address2 : ''}<br>
      ${order.city}, ${order.state} ${order.country} ${order.postcode}<br>
    </div>
    <p style="margin-top:20px;">
      <b>Your order will be shipped via Australian Post within 12-15 business days after we receive your bank transfer.</b><br>
      You will receive an email confirmation as soon as your order ships, with your tracking number.
    </p>
    <p><b>To complete your order, please upload ONE of the following in your My Account Area:</b><br>
      1. Scanned copy of your Driver’s License (front & back), OR<br>
      2. Passport/Government ID <b>plus</b> recent Utility Bill (same address)
    </p>
    <p style="font-size:13px;color:#64748b;">
      Dinar Exchange must verify your identity by law before delivery. See our <a href="${links.privacy}" style="color:#4F46E5;">Privacy Policy</a> and <a href="${links.aml}" style="color:#4F46E5;">AML/CTF Info</a>.
    </p>
    <hr style="margin: 18px 0;" />
    <div>
      <b>Contact Us:</b><br>
      Tel (AUS): ${contact.telAus}, NZ: ${contact.telNz}<br>
      Fax: ${contact.fax}<br>
      Email: <a href="mailto:${contact.email}" style="color:#4F46E5;">${contact.email}</a><br>
      ${company.addressLine}
    </div>
    <div style="font-size:12px; color:#888; margin-top:12px;">
      <p>${company.legalNotice}</p>
      <p>Follow us: <a href="${links.facebook}" style="color:#4F46E5;">Facebook</a> | <a href="${links.twitter}" style="color:#4F46E5;">Twitter</a></p>
      <p style="color:#94a3b8;">&copy; ${new Date().getFullYear()} Dinar Exchange. All rights reserved.</p>
    </div>
  </div>
  `;
}
