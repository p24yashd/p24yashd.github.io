<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>War Variant Experiment (with GitHub Logging)</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; margin-top: 40px; }
    button { margin: 10px; padding: 10px 20px; font-size: 16px; cursor: pointer; }
    #game, #choiceBtns, #finalActions { display: none; }
    #log { margin-top: 20px; max-height: 250px; overflow-y: auto; }
    #status { margin-top: 15px; font-weight: bold; color: green; }
  </style>
</head>
<body>
  <h1>⚔️ War Variant Experiment</h1>

  <!-- Demographics Form -->
  <div id="form">
    <h3>Participant Information</h3>
    <label>Name: <input type="text" id="name"></label><br><br>
    <label>Age: <input type="number" id="age"></label><br><br>
    <label>Gender: 
      <select id="gender">
        <option value="">--Select--</option>
        <option>Male</option>
        <option>Female</option>
        <option>Other</option>
      </select>
    </label><br><br>
    <button onclick="startGame()">Start Game</button>
  </div>

  <!-- Game Area -->
  <div id="game">
    <p>Unique Game ID: <span id="gameId"></span></p>
    <p>Rounds left: <span id="rounds">10</span></p>
    <p>Your Score: <span id="playerScore">0</span> | Computer Score: <span id="compScore">0</span></p>

    <button id="dealBtn" onclick="dealCards()">Deal Card</button>

    <div id="current"></div>
    <div id="choiceBtns">
      <button onclick="resolveRound(true)">Play</button>
      <button onclick="resolveRound(false)">Skip</button>
    </div>

    <div id="log"></div>
  </div>

  <!-- Final Actions -->
  <div id="finalActions">
    <button onclick="uploadToGitHub()">Save Data</button>
    <p id="status"></p>
    <button id="downloadBtn" onclick="downloadWorkbook()" style="display:none;">Download Workbook</button>
  </div>

  <script>
    // ---------------- CONFIG ----------------
    const GITHUB_USER = "YOUR_USERNAME";   // your GitHub username
    const REPO_NAME = "YOUR_REPO";         // repo where Excel lives
    const FILE_PATH = "data/war_game.xlsx"; // path in repo
    const TOKEN = "YOUR_PERSONAL_ACCESS_TOKEN"; // ⚠️ Do NOT expose in public repos

    // ------------- Game Variables -----------
    let rounds = 10;
    let playerScore = 0, compScore = 0;
    let flatResults = {};
    let gameId = "G" + Date.now();
    let demographics = {};
    let currentPlayerCard = null, currentCompCard = null;
    let currentRound = 0;

    // ------------- Game Logic ---------------
    function startGame() {
      const name = document.getElementById("name").value;
      const age = document.getElementById("age").value;
      const gender = document.getElementById("gender").value;

      if (!name || !age || !gender) {
        alert("Please fill all demographic fields.");
        return;
      }

      demographics = { GameID: gameId, Name: name, Age: age, Gender: gender };

      document.getElementById("form").style.display = "none";
      document.getElementById("game").style.display = "block";
      document.getElementById("gameId").innerText = gameId;
    }

    function dealCards() {
      if (rounds <= 0) return;

      currentRound = 11 - rounds;
      currentPlayerCard = Math.floor(Math.random() * 10) + 1;
      currentCompCard = Math.floor(Math.random() * 10) + 1;

      document.getElementById("current").innerHTML = 
        `<p>Round ${currentRound}:<br>
        Your Card: <b>${currentPlayerCard}</b><br>
        Computer's Card: <i>Hidden</i></p>`;

      document.getElementById("choiceBtns").style.display = "block";
      document.getElementById("dealBtn").style.display = "none";
    }

    function resolveRound(playerPlays) {
      let outcome = "Skipped";

      if (playerPlays) {
        if (currentPlayerCard > currentCompCard) {
          playerScore += 10;
          compScore -= 10;
          outcome = "You Win!";
        } else if (currentPlayerCard < currentCompCard) {
          playerScore -= 10;
          compScore += 10;
          outcome = "Computer Wins!";
        } else {
          outcome = "Draw (no score change)";
        }
      }

      flatResults[`PlayerChoice${currentRound}`] = playerPlays ? "Play" : "Skip";
      flatResults[`PlayerCard${currentRound}`] = playerPlays ? currentPlayerCard : "Skipped";
      flatResults[`ComputerCard${currentRound}`] = currentCompCard;
      flatResults[`Outcome${currentRound}`] = outcome;

      rounds--;
      document.getElementById("rounds").innerText = rounds;
      document.getElementById("playerScore").innerText = playerScore;
      document.getElementById("compScore").innerText = compScore;

      const log = document.getElementById("log");
      log.innerHTML += `<p>Round ${currentRound}: You ${playerPlays ? "played " + currentPlayerCard : "skipped"} | 
        Computer ${currentCompCard} → ${outcome}</p>`;

      document.getElementById("choiceBtns").style.display = "none";
      document.getElementById("dealBtn").style.display = "inline-block";
      document.getElementById("current").innerHTML = "";

      if (rounds === 0) {
        document.getElementById("finalActions").style.display = "block";
        document.getElementById("dealBtn").style.display = "none";
      }
    }

    // ----------- GitHub Excel Update --------
    async function uploadToGitHub() {
      const demoRow = { Serial: "", GameID: gameId, ...demographics };
      const gameRow = { Serial: "", GameID: gameId, ...flatResults };

      // Fetch current file
      const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        headers: { Authorization: `token ${TOKEN}` }
      });
      const data = await res.json();
      const content = atob(data.content); // base64 decode

      // Read workbook
      const wb = XLSX.read(content, { type: "binary" });

      // Demographics sheet
      const wsDemo = wb.Sheets["Demographics"];
      const demoJson = XLSX.utils.sheet_to_json(wsDemo, { defval: "" });
      demoRow.Serial = demoJson.length + 1;
      demoJson.push(demoRow);
      wb.Sheets["Demographics"] = XLSX.utils.json_to_sheet(demoJson);

      // GameData sheet
      const wsGame = wb.Sheets["GameData"];
      const gameJson = XLSX.utils.sheet_to_json(wsGame, { defval: "" });
      gameRow.Serial = gameJson.length + 1;
      gameJson.push(gameRow);
      wb.Sheets["GameData"] = XLSX.utils.json_to_sheet(gameJson);

      // Convert back to base64
      const newContent = XLSX.write(wb, { type: "base64" });

      // Commit back
      await fetch(`https://api.github.com/repos/${GITHUB_USER}/${REPO_NAME}/contents/${FILE_PATH}`, {
        method: "PUT",
        headers: {
          Authorization: `token ${TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: "Append new game data",
          content: newContent,
          sha: data.sha
        })
      });

      document.getElementById("status").innerText = "Game Data Saved";
      document.getElementById("downloadBtn").style.display = "inline-block";
    }

    // ----------- Download Workbook ----------
    async function downloadWorkbook() {
      const res = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${REPO_NAME}/main/${FILE_PATH}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "war_game.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  </script>
</body>
</html>
