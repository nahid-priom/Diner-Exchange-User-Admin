import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { Resend } from "resend";
import { generateOrderConfirmationEmail } from "@/utils/orderConfirmationEmail";

// Schema definition
const OrderSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  mobile: String,
  country: String,
  address: String,
  city: String,
  state: String,
  postcode: String,
  currency: String,
  quantity: Number,
  idFileUrl: String,
  acceptTerms: Boolean,
  paymentMethod: String,
  paymentReceiptUrl: String,
  skipReceipt: Boolean,
  comments: String,
  status: { type: String, default: "pending" },
}, { collection: "orders", timestamps: true });

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// GET /user/api/orders?email=...
export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    if (!email) {
      return new Response(JSON.stringify({ error: "Missing email" }), { status: 400 });
    }
    const decodedEmail = decodeURIComponent(email);
    const orders = await Order.find({ email: decodedEmail }).sort({ createdAt: -1 });
    return new Response(JSON.stringify({ orders }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GET /user/api/orders error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

// POST /user/api/orders
export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();

    if (!body.email || !body.fullName || !body.currency || !body.idFileUrl) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400 });
    }

    // --- CALCULATE dynamic order values ---
    const productName = "Uncirculated Iraqi Dinar 25k";
    const pricePerUnit = 3.8125;
    const quantity = Number(body.quantity) || 1;
    const subtotal = pricePerUnit * quantity;
    const shippingCost = 49.99;
    const totalAmount = subtotal + shippingCost;

    // Save order
    const order = await Order.create({ ...body, quantity });

    // --- Build data for email ---
    const company = {
      fullName: "Oz Trading Group Pty Ltd",
      addressLine: "PO BOX 2028 Lalor Vic 3075",
      legalNotice: "Dinar exchange is not an investment company. Any information found on this site and in email correspondence should not be taken as investment advice.",
    };
    const contact = {
      telAus: "1300 856 881",
      telNz: "09 951 80 20",
      fax: "1300 857 881",
      email: "dinars@dinarexchange.com.au"
    };
    const paymentInfo = {
      bankName: "National Australia Bank Limited",
      bsb: "083004",
      accountNumber: "739384751"
    };
    const links = {
      privacy: "https://dinarexchange.com.au/privacy",
      aml: "https://austrac.gov.au",
      facebook: "http://www.facebook.com/dinarexchange",
      twitter: "http://www.twitter.com/DinarExchange",
    };
    const loginUrl = "https://dinarexchange.com.au/login/";
    const username = body.email;
    const password = "******"; // Never send a real password unless user set it at runtime!

    // --- Generate HTML for the email ---
    const html = generateOrderConfirmationEmail({
      order: {
        ...body,
        _id: order._id,
        productName,
        quantity,
        subtotal,
        shippingCost,
        totalAmount,
        status: order.status,
      },
      paymentInfo,
      loginUrl,
      username,
      password,
      company,
      contact,
      links,
    });

    // --- Send email ---
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const subject = 'Your Dinar Exchange Order Confirmation';
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: body.email,
        bcc: process.env.ORDER_NOTIFICATION_EMAIL,
        subject,
        html,
      });
    } catch (err) {
      console.error('Failed to send order confirmation email:', err);
    }

    return new Response(JSON.stringify({ message: "Order saved", order }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("POST /user/api/orders error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
