const fs = require("fs");
const XLSX = require("xlsx");

const gameData = JSON.parse(fs.readFileSync("game.json", "utf-8"));

// Load workbook
const filePath = "data/war_game.xlsx";
const wb = XLSX.readFile(filePath);

// Demographics sheet
const wsDemo = wb.Sheets["Demographics"];
const demoJson = XLSX.utils.sheet_to_json(wsDemo, { defval: "" });
gameData.demographics.Serial = demoJson.length + 1;
demoJson.push(gameData.demographics);
wb.Sheets["Demographics"] = XLSX.utils.json_to_sheet(demoJson);

// GameData sheet
const wsGame = wb.Sheets["GameData"];
const gameJson = XLSX.utils.sheet_to_json(wsGame, { defval: "" });
gameData.gameRow.Serial = gameJson.length + 1;
gameJson.push(gameData.gameRow);
wb.Sheets["GameData"] = XLSX.utils.json_to_sheet(gameJson);

// Save workbook
XLSX.writeFile(wb, filePath);
