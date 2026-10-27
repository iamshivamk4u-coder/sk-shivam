import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const sourcePath = "F:/Skill Lance web data/SkillLance Database.xlsx";
const outputDir = "workbook-review";
const input = await FileBlob.load(sourcePath);
const workbook = await SpreadsheetFile.importXlsx(input);
const summary = await workbook.inspect({
  kind: "workbook,sheet,table,region",
  range: "A1:Z40",
  maxChars: 10000,
  tableMaxRows: 20,
  tableMaxCols: 20,
});
console.log(summary.ndjson);
const sheets = await workbook.inspect({ kind: "sheet", include: "id,name" });
console.log(sheets.ndjson);
const firstSheet = workbook.worksheets.getItemAt(0);
await fs.mkdir(outputDir, { recursive: true });
const preview = await workbook.render({ sheetName: firstSheet.name, autoCrop: "all", scale: 1.25, format: "png" });
await fs.writeFile(`${outputDir}/source-preview.png`, new Uint8Array(await preview.arrayBuffer()));
