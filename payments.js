const checkoutScript = document.createElement("script");
checkoutScript.src = "https://checkout.razorpay.com/v1/checkout.js";
checkoutScript.async = true;
document.head.appendChild(checkoutScript);

const courseForm = document.querySelector("#checkout-details");
const courseDialog = document.querySelector("#checkout-dialog");
const courseTitle = document.querySelector("#checkout-course-title");
const coursePrice = document.querySelector("#checkout-course-price");
const closeCheckout = document.querySelector(".checkout-close");
const coursePrices = { ELITE: "₹699", MARKETING: "₹1,499", SOFT: "₹2,599", PRO: "₹4,999", PRIME: "₹7,499", FINANCE: "₹9,999" };
let selectedCourse = null;

document.querySelectorAll(".course-checkout").forEach((button) => {
  button.addEventListener("click", () => {
    selectedCourse = button.dataset.course;
    courseTitle.textContent = button.dataset.name;
    coursePrice.textContent = coursePrices[selectedCourse];
    courseDialog.showModal();
  });
});

closeCheckout?.addEventListener("click", () => courseDialog.close());

courseForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = courseForm.querySelector("button[type=submit]");
  const message = courseForm.querySelector(".checkout-message");
  submit.disabled = true;
  message.hidden = true;
  const form = new FormData(courseForm);
  const affiliateCode = new URLSearchParams(window.location.search).get("ref") || "";
  try {
    const orderResponse = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseCode: selectedCourse,
        affiliateCode,
        customerName: form.get("name"),
        customerEmail: form.get("email"),
        customerMobile: form.get("mobile"),
      }),
    });
    const order = await orderResponse.json();
    if (!orderResponse.ok) throw new Error(order.error || "Unable to create your payment order.");
    const payment = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: "SkillLance",
      description: order.courseName,
      order_id: order.orderId,
      prefill: { name: form.get("name"), email: form.get("email"), contact: form.get("mobile") },
      theme: { color: "#ff6847" },
      handler: () => {
        courseDialog.close();
        window.alert("Payment received. We are confirming your course access and will send your secure dashboard invitation by e-mail.");
      },
    });
    payment.open();
  } catch (error) {
    message.textContent = error.message;
    message.hidden = false;
  } finally {
    submit.disabled = false;
  }
});
