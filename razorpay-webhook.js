import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const config = { api: { bodyParser: false } };

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });

  const rawBody = await readRawBody(request);
  const signature = request.headers["x-razorpay-signature"];
  const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const receivedSignature = Buffer.from(signature || "", "utf8");
  const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");
  if (!signature || receivedSignature.length !== expectedSignatureBuffer.length || !crypto.timingSafeEqual(receivedSignature, expectedSignatureBuffer)) {
    return response.status(401).json({ error: "Invalid webhook signature" });
  }

  const event = JSON.parse(rawBody.toString("utf8"));
  if (event.event !== "payment.captured") return response.status(200).json({ received: true });

  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment?.order_id) return response.status(200).json({ received: true, ignored: "Payment order information is missing." });
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: order, error: orderError } = await supabase.from("checkout_orders").select("customer_email, customer_name, course_code, affiliate_code, amount").eq("razorpay_order_id", payment.order_id).single();
  if (orderError || !order) return response.status(200).json({ received: true, ignored: "Payment order is not a SkillLance checkout order." });

  const { data: customer, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(order.customer_email, {
    data: { full_name: order.customer_name || "" },
    redirectTo: `${process.env.SITE_URL}/set-password.html`,
  });
  if (inviteError && !/already been registered/i.test(inviteError.message)) return response.status(500).json({ error: inviteError.message });

  const { data: profile } = customer?.user
    ? { data: { user_id: customer.user.id } }
    : await supabase.from("profiles").select("user_id").eq("email", order.customer_email).single();
  if (!profile?.user_id) return response.status(500).json({ error: "Customer profile could not be created." });

  const { data: affiliate } = order.affiliate_code
    ? await supabase.from("affiliates").select("id").eq("referral_code", order.affiliate_code).eq("status", "active").maybeSingle()
    : { data: null };
  const { data: sale, error: saleError } = await supabase.from("sales").upsert({
    razorpay_payment_id: payment.id,
    customer_id: profile.user_id,
    course_code: order.course_code,
    affiliate_id: affiliate?.id || null,
    amount: order.amount,
    payment_status: "paid",
    paid_at: new Date(payment.created_at * 1000).toISOString(),
  }, { onConflict: "razorpay_payment_id" }).select("id").single();
  if (saleError) return response.status(500).json({ error: saleError.message });

  await supabase.from("enrollments").upsert({ customer_id: profile.user_id, course_code: order.course_code, sale_id: sale.id, access_status: "granted" }, { onConflict: "customer_id,course_code" });
  if (affiliate?.id) await supabase.from("commissions").upsert({ sale_id: sale.id, affiliate_id: affiliate.id, amount: Math.round(order.amount * 0.7), status: "approved" }, { onConflict: "sale_id" });
  await supabase.from("checkout_orders").update({ status: "paid", paid_at: new Date(payment.created_at * 1000).toISOString() }).eq("razorpay_order_id", payment.order_id);
  return response.status(200).json({ received: true });
}
