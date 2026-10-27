import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "outputs/skilllance-affiliate-database";
const outputPath = `${outputDir}/SkillLance Database.xlsx`;
const workbook = Workbook.create();
const font = "Aptos";
const colors = {
  ink: "#17231F",
  green: "#243C32",
  orange: "#FF6847",
  cream: "#FFFDF7",
  paleGreen: "#EDF5EE",
  paleOrange: "#FFF0EB",
  paleYellow: "#FFF6D9",
  paleBlue: "#EAF3F8",
  line: "#DCE5DE",
  muted: "#63736A",
};

function setBase(sheet) {
  sheet.showGridLines = false;
  sheet.getRange("A1:Z600").format.font = { name: font, size: 10, color: colors.ink };
  sheet.getRange("A1:Z600").format.verticalAlignment = "center";
}

function title(sheet, heading, note, endCol) {
  sheet.getRange(`A1:${endCol}1`).merge();
  sheet.getRange("A1").values = [[heading]];
  sheet.getRange("A1").format = { font: { name: font, size: 16, bold: true, color: colors.ink } };
  sheet.getRange(`A2:${endCol}2`).merge();
  sheet.getRange("A2").values = [[note]];
  sheet.getRange("A2").format = { font: { name: font, size: 10, italic: true, color: colors.muted } };
  sheet.getRange(`A3:${endCol}3`).format.borders = { bottom: { style: "thin", color: colors.line } };
  sheet.getRange("A1").format.rowHeight = 25;
  sheet.getRange("A2").format.rowHeight = 19;
}

function header(sheet, range) {
  sheet.getRange(range).format = {
    fill: colors.green,
    font: { name: font, size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    borders: { bottom: { style: "thin", color: "#FFFFFF" } },
  };
  sheet.getRange(range).format.rowHeight = 24;
}

function inputColumns(sheet, range) {
  sheet.getRange(range).format.fill = colors.paleYellow;
}

function formulaColumns(sheet, range) {
  sheet.getRange(range).format.fill = colors.paleGreen;
}

function setWidths(sheet, widths) {
  for (const [column, width] of Object.entries(widths)) {
    sheet.getRange(`${column}1:${column}504`).format.columnWidth = width;
  }
}

function seedFormulas(sheet, column, formulaMaker, rowCount = 500) {
  const formulas = Array.from({ length: rowCount }, (_, index) => [formulaMaker(index + 5)]);
  sheet.getRange(`${column}5:${column}${rowCount + 4}`).formulas = formulas;
}

const dashboard = workbook.worksheets.add("Dashboard");
const customers = workbook.worksheets.add("Customers");
const enrollments = workbook.worksheets.add("Enrollments");
const courses = workbook.worksheets.add("Courses");
const sales = workbook.worksheets.add("Sales");
const affiliates = workbook.worksheets.add("Affiliates");
const payouts = workbook.worksheets.add("Payouts");
const lists = workbook.worksheets.add("Lists");

[dashboard, customers, enrollments, courses, sales, affiliates, payouts, lists].forEach(setBase);

dashboard.tabColor = colors.green;
title(dashboard, "SkillLance Operations Database", "Summary of customers, paid enrollments, sales, affiliate commissions, and payouts.", "K");
dashboard.getRange("A5:K5").values = [["Customers", "", "", "Active enrollments", "", "", "Paid course revenue", "", "", "Available affiliate payout", ""]];
dashboard.getRange("A6:K6").values = [["", "", "", "", "", "", "", "", "", "", ""]];
dashboard.getRange("A5:B6").format.fill = colors.paleGreen;
dashboard.getRange("D5:E6").format.fill = colors.paleBlue;
dashboard.getRange("G5:H6").format.fill = colors.paleOrange;
dashboard.getRange("J5:K6").format.fill = colors.paleYellow;
dashboard.getRange("A5:K6").format.borders = { preset: "outside", style: "thin", color: colors.line };
dashboard.getRange("A5").format.font = { name: font, size: 10, bold: true, color: colors.muted };
dashboard.getRange("D5").format.font = { name: font, size: 10, bold: true, color: colors.muted };
dashboard.getRange("G5").format.font = { name: font, size: 10, bold: true, color: colors.muted };
dashboard.getRange("J5").format.font = { name: font, size: 10, bold: true, color: colors.muted };
dashboard.getRange("A6").formulas = [["=COUNTA(Customers!$A$5:$A$504)"]];
dashboard.getRange("D6").formulas = [["=COUNTIFS(Enrollments!$I$5:$I$504,\"Granted\")"]];
dashboard.getRange("G6").formulas = [["=SUMIFS(Sales!$G$5:$G$504,Sales!$H$5:$H$504,\"Paid\")"]];
dashboard.getRange("J6").formulas = [["=SUM(Affiliates!$J$5:$J$504)"]];
dashboard.getRange("A6,D6,G6,J6").format.font = { name: font, size: 18, bold: true, color: colors.ink };
dashboard.getRange("G6,J6").format.numberFormat = "₹#,##0";
dashboard.getRange("A9:B9").values = [["Sales and commission", "Amount"]];
header(dashboard, "A9:B9");
dashboard.getRange("A10:A14").values = [["Paid sales"], ["Paid course revenue"], ["Approved affiliate commission"], ["Paid affiliate payouts"], ["Commission awaiting payout"]];
dashboard.getRange("B10:B14").formulas = [
  ["=COUNTIFS(Sales!$H$5:$H$504,\"Paid\")"],
  ["=SUMIFS(Sales!$G$5:$G$504,Sales!$H$5:$H$504,\"Paid\")"],
  ["=SUMIFS(Sales!$K$5:$K$504,Sales!$L$5:$L$504,\"Approved\")"],
  ["=SUMIFS(Payouts!$G$5:$G$504,Payouts!$H$5:$H$504,\"Paid\")"],
  ["=SUM(Affiliates!$J$5:$J$504)"],
];
dashboard.getRange("B10:B14").format.numberFormat = "₹#,##0";
dashboard.getRange("A10:B14").format.borders = { insideHorizontal: { style: "thin", color: colors.line }, bottom: { style: "thin", color: colors.line } };
dashboard.getRange("D9:E9").values = [["Database controls", "Value"]];
header(dashboard, "D9:E9");
dashboard.getRange("D10:D14").values = [["Affiliate commission rate"], ["Minimum payout"], ["Login user ID"], ["Password storage"], ["Sales source"]];
dashboard.getRange("E10:E14").values = [[0.7], [500], ["Customer e-mail"], ["Do not store passwords"], ["Razorpay payment export"]];
dashboard.getRange("E10").format.numberFormat = "0%";
dashboard.getRange("E11").format.numberFormat = "₹#,##0";
dashboard.getRange("D10:E14").format.borders = { insideHorizontal: { style: "thin", color: colors.line }, bottom: { style: "thin", color: colors.line } };
dashboard.getRange("G9:K9").merge();
dashboard.getRange("G9").values = [["Data entry order"]];
header(dashboard, "G9:K9");
dashboard.getRange("G10:K14").values = [
  ["1", "Add or update customer details on Customers", "", "", ""],
  ["2", "Record the paid course purchase in Sales", "", "", ""],
  ["3", "Grant course access in Enrollments", "", "", ""],
  ["4", "Create the affiliate record and referral code", "", "", ""],
  ["5", "Record payout payments after approval", "", "", ""],
];
dashboard.getRange("G10:G14").format = { fill: colors.paleOrange, font: { name: font, bold: true, color: colors.orange }, horizontalAlignment: "center" };
dashboard.getRange("H10:K14").merge(true);
dashboard.getRange("G10:K14").format.borders = { insideHorizontal: { style: "thin", color: colors.line }, bottom: { style: "thin", color: colors.line } };
setWidths(dashboard, { A: 27, B: 16, C: 4, D: 26, E: 21, F: 4, G: 20, H: 27, I: 16, J: 25, K: 16 });

title(customers, "Customers", "One row per learner. Their e-mail is also their affiliate dashboard user ID.", "J");
customers.getRange("A4:J4").values = [["Customer ID", "Created date", "Full name", "E-mail", "Mobile no.", "State", "Login user ID", "Account status", "Password setup", "Notes"]];
header(customers, "A4:J4");
seedFormulas(customers, "G", (r) => `=IF(D${r}=\"\",\"\",D${r})`);
inputColumns(customers, "A5:F504");
inputColumns(customers, "H5:J504");
formulaColumns(customers, "G5:G504");
customers.getRange("B5:B504").format.numberFormat = "dd-mmm-yyyy";
customers.getRange("A4:J504").format.borders = { bottom: { style: "thin", color: colors.line } };
customers.getRange("H5:H504").dataValidation = { rule: { type: "list", formula1: "Lists!$A$5:$A$7" } };
customers.getRange("I5:I504").dataValidation = { rule: { type: "list", formula1: "Lists!$B$5:$B$8" } };
customers.freezePanes.freezeRows(4);
setWidths(customers, { A: 15, B: 14, C: 24, D: 30, E: 16, F: 19, G: 30, H: 16, I: 18, J: 28 });

title(courses, "Courses", "Current SkillLance package pricing, Razorpay payment button IDs, and the affiliate commission rate.", "G");
courses.getRange("A4:G4").values = [["Course ID", "Course name", "Price", "Course count", "Razorpay payment button ID", "Affiliate commission rate", "Commission per sale"]];
header(courses, "A4:G4");
courses.getRange("A5:F10").values = [
  ["ELITE", "Elite Package", 699, 8, "pl_TsbhUucoFI4Zwq", 0.7],
  ["MARKETING", "Marketing Mastery", 1499, 2, "pl_Tsc0RtshcVOlv4", 0.7],
  ["SOFT", "Soft Skill Mastery", 2599, 2, "pl_Tsc6SWIstwLyX9", 0.7],
  ["PRO", "Pro Package", 4999, 4, "pl_TscASQMDiKuLXb", 0.7],
  ["PRIME", "Prime Package", 7499, 6, "pl_Tscrao7delyrCN", 0.7],
  ["FINANCE", "Finance Package", 9999, 3, "pl_Tsd2sXzAgnBo2g", 0.7],
];
courses.getRange("G5").formulas = [["=C5*F5"]];
courses.getRange("G5:G10").fillDown();
inputColumns(courses, "A5:F10");
formulaColumns(courses, "G5:G10");
courses.getRange("C5:C10").format.numberFormat = "₹#,##0";
courses.getRange("F5:F10").format.numberFormat = "0%";
courses.getRange("G5:G10").format.numberFormat = "₹#,##0";
courses.getRange("A4:G10").format.borders = { bottom: { style: "thin", color: colors.line } };
setWidths(courses, { A: 15, B: 27, C: 14, D: 14, E: 29, F: 24, G: 22 });

title(enrollments, "Enrollments", "Record course access separately from the Razorpay sale so learning access can be managed clearly.", "K");
enrollments.getRange("A4:K4").values = [["Enrollment ID", "Enrollment date", "Customer ID", "Course ID", "Course name", "Course price", "Payment status", "Payment ID", "Course access", "Login issued date", "Notes"]];
header(enrollments, "A4:K4");
seedFormulas(enrollments, "E", (r) => `=IF(D${r}=\"\",\"\",VLOOKUP(D${r},Courses!$A$5:$G$10,2,FALSE))`);
seedFormulas(enrollments, "F", (r) => `=IF(D${r}=\"\",\"\",VLOOKUP(D${r},Courses!$A$5:$G$10,3,FALSE))`);
inputColumns(enrollments, "A5:D504");
inputColumns(enrollments, "G5:K504");
formulaColumns(enrollments, "E5:F504");
enrollments.getRange("B5:B504").format.numberFormat = "dd-mmm-yyyy";
enrollments.getRange("F5:F504").format.numberFormat = "₹#,##0";
enrollments.getRange("J5:J504").format.numberFormat = "dd-mmm-yyyy";
enrollments.getRange("D5:D504").dataValidation = { rule: { type: "list", formula1: "Courses!$A$5:$A$10" } };
enrollments.getRange("G5:G504").dataValidation = { rule: { type: "list", formula1: "Lists!$C$5:$C$8" } };
enrollments.getRange("I5:I504").dataValidation = { rule: { type: "list", formula1: "Lists!$D$5:$D$7" } };
enrollments.getRange("A4:K504").format.borders = { bottom: { style: "thin", color: colors.line } };
enrollments.freezePanes.freezeRows(4);
setWidths(enrollments, { A: 16, B: 15, C: 15, D: 14, E: 27, F: 14, G: 15, H: 24, I: 15, J: 16, K: 28 });

title(sales, "Sales", "Enter each Razorpay payment once. Commission amounts calculate only for paid sales with a referrer affiliate ID.", "M");
sales.getRange("A4:M4").values = [["Sale ID", "Razorpay payment ID", "Sale date", "Customer ID", "Course ID", "Course name", "Course price", "Payment status", "Referrer affiliate ID", "Commission rate", "Commission amount", "Commission status", "Notes"]];
header(sales, "A4:M4");
seedFormulas(sales, "F", (r) => `=IF(E${r}=\"\",\"\",VLOOKUP(E${r},Courses!$A$5:$G$10,2,FALSE))`);
seedFormulas(sales, "G", (r) => `=IF(E${r}=\"\",\"\",VLOOKUP(E${r},Courses!$A$5:$G$10,3,FALSE))`);
seedFormulas(sales, "J", (r) => `=IF(I${r}=\"\",\"\",VLOOKUP(E${r},Courses!$A$5:$G$10,6,FALSE))`);
seedFormulas(sales, "K", (r) => `=IF(AND(H${r}=\"Paid\",I${r}<>\"\"),G${r}*J${r},0)`);
inputColumns(sales, "A5:E504");
inputColumns(sales, "H5:I504");
inputColumns(sales, "L5:M504");
formulaColumns(sales, "F5:G504");
formulaColumns(sales, "J5:K504");
sales.getRange("C5:C504").format.numberFormat = "dd-mmm-yyyy";
sales.getRange("G5:G504").format.numberFormat = "₹#,##0";
sales.getRange("J5:J504").format.numberFormat = "0%";
sales.getRange("K5:K504").format.numberFormat = "₹#,##0";
sales.getRange("E5:E504").dataValidation = { rule: { type: "list", formula1: "Courses!$A$5:$A$10" } };
sales.getRange("H5:H504").dataValidation = { rule: { type: "list", formula1: "Lists!$C$5:$C$8" } };
sales.getRange("L5:L504").dataValidation = { rule: { type: "list", formula1: "Lists!$E$5:$E$8" } };
sales.getRange("A4:M504").format.borders = { bottom: { style: "thin", color: colors.line } };
sales.freezePanes.freezeRows(4);
setWidths(sales, { A: 15, B: 26, C: 14, D: 15, E: 14, F: 26, G: 15, H: 15, I: 21, J: 17, K: 18, L: 18, M: 28 });

title(affiliates, "Affiliates", "Use the customer e-mail as the dashboard user ID. Do not record plain-text passwords in this workbook.", "L");
affiliates.getRange("A4:L4").values = [["Affiliate ID", "Customer ID", "Affiliate name", "User ID / e-mail", "Referral code", "Approved date", "Affiliate status", "Approved commission", "Paid out", "Available payout", "Payout method", "Payout address"]];
header(affiliates, "A4:L4");
seedFormulas(affiliates, "C", (r) => `=IF(B${r}=\"\",\"\",VLOOKUP(B${r},Customers!$A$5:$J$504,3,FALSE))`);
seedFormulas(affiliates, "D", (r) => `=IF(B${r}=\"\",\"\",VLOOKUP(B${r},Customers!$A$5:$J$504,4,FALSE))`);
seedFormulas(affiliates, "H", (r) => `=IF(A${r}=\"\",\"\",SUMIFS(Sales!$K$5:$K$504,Sales!$I$5:$I$504,A${r},Sales!$L$5:$L$504,\"Approved\"))`);
seedFormulas(affiliates, "I", (r) => `=IF(A${r}=\"\",\"\",SUMIFS(Payouts!$G$5:$G$504,Payouts!$B$5:$B$504,A${r},Payouts!$H$5:$H$504,\"Paid\"))`);
seedFormulas(affiliates, "J", (r) => `=IF(A${r}=\"\",\"\",H${r}-I${r})`);
inputColumns(affiliates, "A5:B504");
inputColumns(affiliates, "E5:G504");
inputColumns(affiliates, "K5:L504");
formulaColumns(affiliates, "C5:D504");
formulaColumns(affiliates, "H5:J504");
affiliates.getRange("F5:F504").format.numberFormat = "dd-mmm-yyyy";
affiliates.getRange("H5:J504").format.numberFormat = "₹#,##0";
affiliates.getRange("G5:G504").dataValidation = { rule: { type: "list", formula1: "Lists!$F$5:$F$7" } };
affiliates.getRange("K5:K504").dataValidation = { rule: { type: "list", formula1: "Lists!$H$5:$H$7" } };
affiliates.getRange("A4:L504").format.borders = { bottom: { style: "thin", color: colors.line } };
affiliates.freezePanes.freezeRows(4);
setWidths(affiliates, { A: 15, B: 15, C: 24, D: 30, E: 17, F: 15, G: 16, H: 20, I: 15, J: 19, K: 18, L: 30 });

title(payouts, "Payouts", "Record each affiliate payout only after approval. The payment reference is required for reconciliation.", "K");
payouts.getRange("A4:K4").values = [["Payout ID", "Affiliate ID", "Request date", "Period start", "Period end", "Approved commission", "Amount paid", "Payout status", "Payment reference", "Processed date", "Notes"]];
header(payouts, "A4:K4");
inputColumns(payouts, "A5:K504");
payouts.getRange("C5:E504").format.numberFormat = "dd-mmm-yyyy";
payouts.getRange("F5:G504").format.numberFormat = "₹#,##0";
payouts.getRange("J5:J504").format.numberFormat = "dd-mmm-yyyy";
payouts.getRange("H5:H504").dataValidation = { rule: { type: "list", formula1: "Lists!$G$5:$G$8" } };
payouts.getRange("A4:K504").format.borders = { bottom: { style: "thin", color: colors.line } };
payouts.freezePanes.freezeRows(4);
setWidths(payouts, { A: 15, B: 15, C: 15, D: 15, E: 15, F: 20, G: 15, H: 17, I: 24, J: 15, K: 28 });

title(lists, "Lists", "Controlled values used by the drop-down fields in the database sheets.", "H");
lists.getRange("A4:H4").values = [["Account status", "Password setup", "Payment status", "Course access", "Commission status", "Affiliate status", "Payout status", "Payout method"]];
header(lists, "A4:H4");
lists.getRange("A5:H8").values = [
  ["Active", "Not sent", "Pending", "Not granted", "Pending", "Active", "Requested", "UPI"],
  ["Inactive", "Sent", "Paid", "Granted", "Approved", "Paused", "Approved", "Bank transfer"],
  ["Blocked", "Set", "Failed", "Revoked", "Paid", "Blocked", "Paid", "Other"],
  [null, "Reset requested", "Refunded", null, "Cancelled", null, "Rejected", null],
];
inputColumns(lists, "A5:H8");
lists.getRange("A4:H8").format.borders = { bottom: { style: "thin", color: colors.line } };
setWidths(lists, { A: 18, B: 20, C: 18, D: 18, E: 20, F: 18, G: 18, H: 19 });

for (const sheet of [customers, enrollments, courses, sales, affiliates, payouts, lists]) {
  sheet.getRange("A4:Z4").format.wrapText = true;
}

workbook.recalculate();
await fs.mkdir(outputDir, { recursive: true });

for (const sheet of [dashboard, customers, enrollments, courses, sales, affiliates, payouts, lists]) {
  const preview = await workbook.render({ sheetName: sheet.name, range: "A1:K20", scale: 1.2, format: "png" });
  await fs.writeFile(`${outputDir}/${sheet.name}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const result = await SpreadsheetFile.exportXlsx(workbook);
await result.save(outputPath);

const dashboardCheck = await workbook.inspect({ kind: "table", range: "Dashboard!A1:K14", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 12 });
const formulaErrorCheck = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
console.log(dashboardCheck.ndjson);
console.log(formulaErrorCheck.ndjson);
console.log(`Created ${outputPath}`);
