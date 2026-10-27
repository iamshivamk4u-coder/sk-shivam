import { createClient } from "@supabase/supabase-js";

const courses = {
  ELITE: { name: "Elite Package", amount: 69900 },
  MARKETING: { name: "Marketing Mastery", amount: 149900 },
  SOFT: { name: "Soft Skill Mastery", amount: 259900 },
  PRO: { name: "Pro Package", amount: 499900 },
  PRIME: { name: "Prime Package", amount: 749900 },
  FINANCE: { name: "Finance Package", amount: 999900 },
};

export default async function handler(request, response) {
  if (request.method !== "POST") return response.status(405).json({ error: "Method not allowed" });
  const { courseCode, affiliateCode, customerName, customerEmail, customerMobile } = request.body || {};
  const course = courses[courseCode];
  if (!course || !customerName?.trim() || !customerEmail?.trim() || !customerMobile?.trim()) {
    return response.status(400).json({ error: "Please provide your name, e-mail, mobile number, and a valid course." });
  }

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const receipt = `sl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: course.amount,
      currency: "INR",
      receipt,
      notes: { course_code: courseCode, affiliate_code: affiliateCode || "", customer_email: customerEmail.trim().toLowerCase() },
    }),
  });
  const razorpayOrder = await razorpayResponse.json();
  if (!razorpayResponse.ok) return response.status(502).json({ error: razorpayOrder.error?.description || "Could not start payment." });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await supabase.from("checkout_orders").insert({
    razorpay_order_id: razorpayOrder.id,
    customer_email: customerEmail.trim().toLowerCase(),
    customer_name: customerName.trim(),
    customer_mobile: customerMobile.trim(),
    course_code: courseCode,
    affiliate_code: affiliateCode || null,
    amount: Math.round(course.amount / 100),
  });
  if (error) return response.status(500).json({ error: "Order was created, but could not be recorded. Please contact support before paying." });
  return response.status(200).json({ orderId: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, keyId: process.env.RAZORPAY_KEY_ID, courseName: course.name });
}
