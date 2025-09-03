const fs = require("fs");
const XLSX = require("xlsx");

// Load the JSON data from the game
const gameData = JSON.parse(fs.readFileSync("game.json", "utf-8"));

console.log("====================================");
console.log("📥 Received Game Data from Issue:");
console.log(JSON.stringify(gameData, null, 2));
console.log("====================================");

const filePath = "data/war_game.xlsx";

// Load workbook
const wb = XLSX.readFile(filePath);

// ---- Demographics sheet ----
const wsDemo = wb.Sheets["Demographics"];
let demoJson = XLSX.utils.sheet_to_json(wsDemo, { defval: "" });

// Add Serial number
gameData.demographics.Serial = demoJson.length + 1;

// Append row
demoJson.push(gameData.demographics);

// Rewrite sheet
wb.Sheets["Demographics"] = XLSX.utils.json_to_sheet(demoJson);

console.log("✅ Appended Demographics Row:");
console.log(gameData.demographics);

// ---- GameData sheet ----
const wsGame = wb.Sheets["GameData"];
let gameJson = XLSX.utils.sheet_to_json(wsGame, { defval: "" });

// Add Serial number
gameData.gameRow.Serial = gameJson.length + 1;

// Append row
gameJson.push(gameData.gameRow);

// Rewrite sheet
wb.Sheets["GameData"] = XLSX.utils.json_to_sheet(gameJson);

console.log("✅ Appended GameData Row:");
console.log(gameData.gameRow);

// Save workbook back
XLSX.writeFile(wb, filePath);

console.log("✅ Game data appended successfully");

