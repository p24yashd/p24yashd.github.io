const fs = require("fs");
const XLSX = require("xlsx");

const filePath = "data/war_game.xlsx";

// Read and parse the JSON that the workflow saved from the Issue body
let raw = fs.readFileSync("game.json", "utf-8");
let gameData;
try {
  gameData = JSON.parse(raw);
} catch (e) {
  console.error("❌ The Issue body is not valid JSON. Body was:\n", raw);
  process.exit(1);
}

console.log("====================================");
console.log("📥 Received Game Data from Issue:");
console.log(JSON.stringify(gameData, null, 2));
console.log("====================================");

// Ensure workbook exists
if (!fs.existsSync(filePath)) {
  console.error(`❌ Workbook not found at ${filePath}. Make sure data/war_game.xlsx exists in the repo.`);
  process.exit(1);
}

const wb = XLSX.readFile(filePath);
const now = new Date().toISOString(); // ISO timestamp

// ---- Prepare headers ----
const demoHeaders = ["Serial", "GameID", "Name", "Age", "Gender", "DateSaved"];

const gameHeaders = ["Serial", "GameID"];
for (let i = 1; i <= 10; i++) {
  gameHeaders.push(`PlayerChoice${i}`, `PlayerCard${i}`, `ComputerCard${i}`, `Outcome${i}`);
}
gameHeaders.push("DateSaved");

// ---- Demographics sheet ----
let wsDemo = wb.Sheets["Demographics"];
let demoRows = wsDemo ? XLSX.utils.sheet_to_json(wsDemo, { defval: "" }) : [];

const demoRow = {
  Serial: demoRows.length + 1,
  GameID: gameData.demographics?.GameID || "",
  Name: gameData.demographics?.Name || "",
  Age: gameData.demographics?.Age || "",
  Gender: gameData.demographics?.Gender || "",
  DateSaved: now
};

demoRows.push(demoRow);
wb.Sheets["Demographics"] = XLSX.utils.json_to_sheet(demoRows, { header: demoHeaders });

// ---- GameData sheet ----
let wsGame = wb.Sheets["GameData"];
let gameRows = wsGame ? XLSX.utils.sheet_to_json(wsGame, { defval: "" }) : [];

const newGameRow = { Serial: gameRows.length + 1, GameID: gameData.gameRow?.GameID || "", DateSaved: now };

for (let i = 1; i <= 10; i++) {
  newGameRow[`PlayerChoice${i}`]   = gameData.gameRow?.[`PlayerChoice${i}`]   ?? "";
  newGameRow[`PlayerCard${i}`]     = gameData.gameRow?.[`PlayerCard${i}`]     ?? "";
  newGameRow[`ComputerCard${i}`]   = gameData.gameRow?.[`ComputerCard${i}`]   ?? "";
  newGameRow[`Outcome${i}`]        = gameData.gameRow?.[`Outcome${i}`]        ?? "";
}

gameRows.push(newGameRow);
wb.Sheets["GameData"] = XLSX.utils.json_to_sheet(gameRows, { header: gameHeaders });

// Save workbook
XLSX.writeFile(wb, filePath);

console.log("✅ Appended Demographics Row:", demoRow);
console.log("✅ Appended GameData Row:", newGameRow);
console.log("✅ Game data appended successfully");
