// scripts/ui.js

// --- Element Selectors ---
const uiElements = {
  currentYear: document.getElementById("current-year"),

  coachingInstituteLevelDisplay: document.getElementById(
    "coaching-institute-level-display"
  ),
  coachingInstituteUpgradeCost: document.getElementById(
    "coaching-institute-upgrade-cost"
  ),
  upgradeCoachingInstituteButton: document.getElementById(
    "upgrade-coaching-institute-button"
  ),

  highPerformanceLevelDisplay: document.getElementById(
    "high-performance-level-display"
  ),
  highPerformanceUpgradeCost: document.getElementById(
    "high-performance-upgrade-cost"
  ),
  upgradeHighPerformanceButton: document.getElementById(
    "upgrade-high-performance-button"
  ),

  budgetDisplay: document.getElementById("budget-display"),
  nextEvent: document.getElementById("next-event"),
  scheduleYear: document.getElementById("schedule-year"),
  scheduleList: document.getElementById("schedule-list"),
  messageLog: document.getElementById("message-log"),
  simulateButton: document.getElementById("simulate-button"),
  homeSeriesControls: document.getElementById("home-series-controls"),
  homePitchPrepSelect: document.getElementById("home-pitch-prep-select"),
  rollerChoiceSelect: document.getElementById("roller-choice-select"),
  squadCount: document.getElementById("squad-count"),
  maxSquadSize: document.getElementById("max-squad-size"),
  maxSquadSizeDisplay: document.getElementById("max-squad-size-display"),
  nationalSquadList: document.getElementById("national-squad-list"),
  domesticPoolList: document.getElementById("domestic-pool-list"),
  scoutingReportContent: document.getElementById("scouting-report-content"),
  trainingList: document.getElementById("training-list"),
  
  // Original dropdown elements (may be null if using new UI)
  pitchTypeSelect: document.getElementById("pitch-type"),
  ballTypeSelect: document.getElementById("ball-type"),
  batTypeSelect: document.getElementById("bat-type"),
  
  // New segmented control elements (may be null if using old UI)
  pitchControl: document.getElementById("pitch-control"),
  ballControl: document.getElementById("ball-control"),
  batControl: document.getElementById("bat-control"),
  
  // Shared elements
  currentPitch: document.getElementById("current-pitch"),
  currentBall: document.getElementById("current-ball"),
  currentBat: document.getElementById("current-bat"),
  
  // Scorecard elements (both old and new)
  scorecardSelector: document.getElementById("scorecard-selector"),
  matchSelectorToggle: document.getElementById("match-selector-toggle"),
  matchSelectorDropdown: document.getElementById("match-selector-dropdown"),
  
  facilitiesBudgetDisplay: document.getElementById("facilities-budget-display"),
  facilityLevelDisplay: document.getElementById("facility-level-display"),
  facilityUpgradeCost: document.getElementById("facility-upgrade-cost"),
  upgradeFacilityButton: document.getElementById("upgrade-facility-button"),
  coachLevelDisplay: document.getElementById("coach-level-display"),
  coachUpgradeCost: document.getElementById("coach-upgrade-cost"),
  upgradeCoachButton: document.getElementById("upgrade-coach-button"),
  stadiumUpgradesList: document.getElementById("stadium-upgrades-list"),
  bilateralHistoryList: document.getElementById("bilateral-history-list"),
  tournamentWinsList: document.getElementById("tournament-wins-list"),
  bilateralHistoryLimit: document.getElementById("bilateral-history-limit"),
  hallOfFameList: document.getElementById("hall-of-fame-list"),
  tabsContainer: document.querySelector(".tabs"),
  tabContents: document.querySelectorAll(".tab-content"),
  tabButtons: document.querySelectorAll(".tab-button"),
  
  // New Dashboard Widgets
  recentResultsContent: document.getElementById("recent-results-content"),
  financialContent: document.getElementById("financial-content"),
  widgetBudgetDisplay: document.getElementById("widget-budget-display"),
  widgetLastTransaction: document.getElementById("widget-last-transaction"),
  playerWatchContent: document.getElementById("player-watch-content"),
  punditContent: document.getElementById("pundit-content"),
  notificationsArea: document.getElementById("notifications-area"),
};
uiElements.clearLogButton = document.querySelector(".clear-log-button"); // Add selector for the new button

// --- Helpers ---
function formatHeightImperial(inches) {
  if (typeof inches !== "number" || inches <= 0) return "N/A";
  const ft = Math.floor(inches / 12);
  const ins = inches % 12;
  return `${ft}'${ins}"`;
}
function renderProgressBar(v) {
  const p = Math.max(0, Math.min(100, v || 0));
  return `<div class="progress-bar-container"><div class="progress-bar" style="width:${p}%;"></div></div>`;
}
const OPPONENT_FIRST_NAMES = [
  /*...*/ "David",
  "Steve",
  "Joe",
  "Kane",
  "Virat",
  "Rohit",
  "Quinton",
  "Temba",
  "Jos",
  "Ben",
  "Pat",
  "Mohammad",
  "Mitchell",
  "Jasprit",
  "Kagiso",
  "Trent",
  "Rashid",
  "Wanindu",
  "Shakib",
  "Nicholas",
  "Jason",
  "Sean",
  "Sikandar",
  "Paul",
  "Andy",
  "Devon",
  "Tom",
  "Harry",
  "Travis",
  "Glenn",
  "Aiden",
];
const OPPONENT_LAST_NAMES = [
  /*...*/ "Warner",
  "Smith",
  "Root",
  "Williamson",
  "Kohli",
  "Sharma",
  "de Kock",
  "Bavuma",
  "Buttler",
  "Stokes",
  "Cummins",
  "Starc",
  "Bumrah",
  "Rabada",
  "Boult",
  "Khan",
  "Hasaranga",
  "Al Hasan",
  "Pooran",
  "Holder",
  "Williams",
  "Raza",
  "Stirling",
  "Balbirnie",
  "Conway",
  "Latham",
  "Brook",
  "Head",
  "Maxwell",
  "Markram",
  "Miller",
  "Singh",
  "Ahmed",
  "Ali",
  "Wood",
  "Anderson",
  "Broad",
  "Southee",
  "Henry",
  "Hazlewood",
];

// --- Updated getSkillDisplay ---
function getSkillDisplay(player) {
  const fitness = player.fitness ?? "N/A";
  const htTxt = formatHeightImperial(player.heightInches);
  const wtTxt =
    player.weightLbs !== undefined
      ? `${Math.round(player.weightLbs)}lbs`
      : "N/A";
  const fitBar = typeof fitness === "number" ? renderProgressBar(fitness) : "";
  const ageTxt = player.age ? `Age: ${player.age}` : "";
  const attTxt = player.attitude ? player.attitude : "";
  const attClass = player.attitude ? `attitude-${player.attitude}` : "";
  // ADD Bowling Speed
  const speedTxt =
    player.role === "Fast Bowler" && player.bowlingSpeed
      ? `<span class="player-speed">(${player.bowlingSpeed})</span>`
      : "";

  return `<span class="stat-label" title="Batting Skill">Bat:</span><span class="stat-value">${
    player.batting
  }</span>${renderProgressBar(player.batting)}
            <span class="stat-label" title="Bowling Skill">Bowl:</span><span class="stat-value">${
              player.bowling
            }</span>${renderProgressBar(player.bowling)}${speedTxt}
            <span class="stat-label" title="Fielding Skill">Field:</span><span class="stat-value">${
              player.fielding
            }</span>${renderProgressBar(player.fielding)}
            <br/><span class="stat-label" title="Fitness Level">Fit:</span><span class="stat-value">${fitness}</span>${fitBar}
            <span class="stat-label" title="Height">Ht:</span><span class="stat-value">${htTxt}</span>
            <span class="stat-label" title="Weight">Wt:</span><span class="stat-value">${wtTxt}</span>
            <br/><span class="player-age">${ageTxt}</span> <span class="player-attitude ${attClass}">${attTxt}</span>
            <span class="stat-label" style="margin-left:10px;" title="Potential Skill Ceiling">(Pot: ${
              player.potential
            })</span>`;
}

function createPlayerListItem(player, type) {
  const li = document.createElement("li");
  let btnHTML = "";
  if (type === "domestic") {
    btnHTML =
      gameState.nationalSquadIDs.length < MAX_SQUAD_SIZE
        ? `<button class="select-button" onclick="selectPlayer(${player.id})">Select</button>`
        : `<button disabled>Select</button>`;
  } else if (type === "national") {
    btnHTML = `<button class="deselect-button" onclick="deselectPlayer(${player.id})">Deselect</button>`;
  } else if (type === "training") {
    const foc = gameState.trainingFocus[player.id] || "rest";
    btnHTML = `<div class="modern-select-container" style="min-width: 120px;">
      <select onchange="setTrainingFocus(${player.id},this.value)" class="modern-select" title="Set Focus">
        <option value="rest" ${foc === "rest" ? "selected" : ""}>Rest</option>
        <option value="batting" ${foc === "batting" ? "selected" : ""}>Batting</option>
        <option value="bowling" ${foc === "bowling" ? "selected" : ""}>Bowling</option>
        <option value="fielding" ${foc === "fielding" ? "selected" : ""}>Fielding</option>
        <option value="fitness" ${foc === "fitness" ? "selected" : ""}>Fitness</option>
      </select>
    </div>`;
  }
  li.innerHTML = `<div class="player-info"><span class="player-name">${
    player.name
  } (${player.role})</span><span class="player-stats">${getSkillDisplay(
    player
  )}</span></div><div class="player-actions">${btnHTML}</div>`;
  return li;
}

// --- Rendering Functions ---
function renderAllUI() {
  console.log("Checkpoint U1: renderAllUI started."); // ADD THIS
  try {
    // Wrap in try...catch to catch rendering errors
    updateStatusBarUI();
    renderSquadSelectionUI();
    renderScoutingReportUI(); // Call this before renderScheduleUI might trigger it
    renderNationalSquadListUI();
    renderTrainingListUI();
    renderDomesticSettingsUI();
    renderScheduleUI(); // This might call renderScoutingReportUI again if event changes
    renderFinancesUI();
    renderStadiumUpgradesUI();
    renderHistoryUI();
    renderHallOfFameUI();
    loadScorecards(); // Add call to load scorecard data for the new UI
    
    // Render the new dashboard widgets
    renderRecentResultsWidget();
    renderFinancialWidget();
    renderPlayerWatchWidget();
    renderPunditWidget();
    
    console.log(
      "Checkpoint U2: All render functions called within renderAllUI."
    ); // ADD THIS
  } catch (error) {
    console.error("Error during renderAllUI:", error); // Log rendering errors
    logError("UI Rendering Error! Check console.");
  }
}
function updateStatusBarUI() {
  uiElements.currentYear.textContent = gameState.year;
  uiElements.budgetDisplay.textContent = gameState.budget.toFixed(2);
}
function renderSquadSelectionUI() {
  const list = uiElements.domesticPoolList;
  const domestic = ALL_PLAYERS_DATA.filter(
    (p) =>
      !gameState.nationalSquadIDs.includes(p.id) && p.status !== "RetiredPundit"
  );
  list.innerHTML = "";
  if (domestic.length === 0) {
    list.innerHTML = "<li>No domestic players available.</li>";
    return;
  }
  domestic
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((p) => {
      list.appendChild(createPlayerListItem(p, "domestic"));
    });
  uiElements.maxSquadSize.textContent = MAX_SQUAD_SIZE;
  uiElements.maxSquadSizeDisplay.textContent = MAX_SQUAD_SIZE;
}
function renderNationalSquadListUI() {
  const list = uiElements.nationalSquadList;
  uiElements.squadCount.textContent = gameState.nationalSquadIDs.length;
  list.innerHTML = "";
  if (gameState.nationalSquadIDs.length === 0) {
    list.innerHTML = "<li>No players selected.</li>";
    return;
  }
  const selectedData = gameState.nationalSquadIDs
    .map((id) => getPlayerById(id))
    .filter((p) => p)
    .sort((a, b) => a.name.localeCompare(b.name));
  selectedData.forEach((p) => {
    list.appendChild(createPlayerListItem(p, "national"));
  });
}
function renderTrainingListUI() {
  const list = uiElements.trainingList;
  list.innerHTML = "";
  if (gameState.nationalSquadIDs.length === 0) {
    list.innerHTML = "<li>Select players first.</li>";
    return;
  }
  const selectedData = gameState.nationalSquadIDs
    .map((id) => getPlayerById(id))
    .filter((p) => p)
    .sort((a, b) => a.name.localeCompare(b.name));
  selectedData.forEach((p) => {
    list.appendChild(createPlayerListItem(p, "training"));
  });
}

function renderDomesticSettingsUI() {
  const pitchVal = gameState.domesticSettings.pitch;
  const ballVal = gameState.domesticSettings.ball;
  const batVal = gameState.domesticSettings.bat;

  // Handle the old select dropdowns if they exist
  if (uiElements.pitchTypeSelect) uiElements.pitchTypeSelect.value = pitchVal;
  if (uiElements.ballTypeSelect) uiElements.ballTypeSelect.value = ballVal;
  if (uiElements.batTypeSelect) uiElements.batTypeSelect.value = batVal;

  // Update Images (ensure these elements exist in HTML and image files in /images/)
  const pitchImg = document.getElementById("pitch-image");
  const ballImg = document.getElementById("ball-image");
  const batImg = document.getElementById("bat-image");

  if (pitchImg) pitchImg.src = `images/pitch_${pitchVal.toLowerCase()}.png`;
  if (ballImg) {
    // Handle special case for "SG Test" which is saved as "sgtest" in file name
    let ballFileName = ballVal.toLowerCase();
    if (ballVal === "SG Test") ballFileName = "sgtest";
    ballImg.src = `images/ball_${ballFileName}.png`;
  }
  if (batImg) {
    // Handle special case for "Power Hitting" which is saved as "power_hitting" in file name
    let batFileName = batVal.toLowerCase();
    if (batVal === "Power Hitting") batFileName = "power_hitting";
    batImg.src = `images/bat_${batFileName}.png`;
  }

  // Update text spans
  if (uiElements.currentPitch) uiElements.currentPitch.textContent = pitchVal;
  if (uiElements.currentBall) {
    // Try to get the text from the select if it exists, otherwise use the value
    if (uiElements.ballTypeSelect) {
      const selectedOption = uiElements.ballTypeSelect.options[uiElements.ballTypeSelect.selectedIndex];
      uiElements.currentBall.textContent = selectedOption ? selectedOption.text : ballVal;
    } else {
      uiElements.currentBall.textContent = ballVal;
    }
  }
  if (uiElements.currentBat) uiElements.currentBat.textContent = batVal;

  // Update segmented controls to match game state (for the new UI)
  updateSegmentedControlsFromState();
}

function renderHallOfFameUI() {
  const list = uiElements.hallOfFameList;
  list.innerHTML = "";
  if (HALL_OF_FAMERS.length === 0) {
    list.innerHTML = "<li>No members.</li>";
    return;
  }
  HALL_OF_FAMERS.forEach((name) => {
    const li = document.createElement("li");
    // Generate likely image filename (needs corresponding files in /images/)
    const imgName = name.toLowerCase().replace(/ /g, "_") + ".jpg";
    li.innerHTML = `
            <img src="images/${imgName}" alt="${name}" class="hof-image" onerror="this.style.display='none'"> <!-- Hide if missing -->
            <span class="hof-name">${name}</span>
        `;
    list.appendChild(li);
  });
}

function renderScheduleUI() {
  uiElements.scheduleList.innerHTML = "";
  uiElements.scheduleYear.textContent = gameState.year;
  let isNextHome = false;
  let nextDesc = "End of Year"; // Default if no events left
  if (
    !gameState.schedule ||
    gameState.schedule.length === 0 ||
    gameState.currentEventIndex >= gameState.schedule.length
  ) {
    uiElements.scheduleList.innerHTML = "<p>No more events this year.</p>";
    uiElements.nextEvent.textContent = nextDesc;
    uiElements.simulateButton.disabled = false; // Should allow proceeding to next year
    uiElements.homeSeriesControls.style.display = "none";
    return;
  }

  uiElements.simulateButton.disabled = false; // Ensure enabled if events exist

  for (let i = 0; i < gameState.schedule.length; i++) {
    const evt = gameState.schedule[i];
    const div = document.createElement("div");
    div.className = "schedule-item";
    let desc = "";
    if (evt.type === "Bilateral Series")
      desc = `${evt.matches}-match ${evt.format} vs <span class="schedule-opponent">${evt.opponent}</span> (${evt.location})`;
    else if (evt.type === "Tournament")
      desc = `<span class="schedule-opponent">${evt.name}</span> (${
        evt.format
      }, Host: ${evt.host || evt.location})`; // Show host if available
    div.innerHTML = desc;
    div.title = desc.replace(/<[^>]*>/g, ""); // Add tooltip

    if (i === gameState.currentEventIndex) {
      div.style.borderLeftColor = "#ff9800"; // Orange for next
      div.innerHTML += ' <span class="schedule-details">[NEXT]</span>';
      nextDesc = desc.replace(/<[^>]*>/g, ""); // Update next event description
      div.onclick = () => viewScoutingReport(evt); // Allow clicking to view scouting
      if (evt.type === "Bilateral Series" && evt.location === "Home") {
        isNextHome = true; // Set flag if next is a home bilateral series
      }
      if (evt.location === "Neutral" && evt.reason === "security") {
        div.innerHTML += `<span class="schedule-details" style="color:orange;">[Refused Tour]</span>`;
      }
    } else if (i < gameState.currentEventIndex) {
      div.style.opacity = "0.6";
      div.style.borderLeftColor = "#ccc"; // Grey for done
      div.innerHTML += `<span class="schedule-details">[Done]</span>`;
    } else {
      div.style.borderLeftColor = "#004d00"; // Green for upcoming
      div.innerHTML += `<span class="schedule-details">[Upcoming]</span>`;
    }
    uiElements.scheduleList.appendChild(div);
  }

  uiElements.nextEvent.textContent = nextDesc;

  // Show/hide home controls based on the *next* event
  if (isNextHome) {
    uiElements.homeSeriesControls.style.display = "block";
    uiElements.homePitchPrepSelect.value =
      gameState.currentHomePitchPrep || "balanced";
    uiElements.rollerChoiceSelect.value =
      gameState.currentRollerChoice || "standard";
  } else {
    uiElements.homeSeriesControls.style.display = "none";
  }

  // Update scouting report based on the *next* event
  if (gameState.currentEventIndex < gameState.schedule.length) {
    const nextEvent = gameState.schedule[gameState.currentEventIndex];
    if (nextEvent.type === "Bilateral Series") {
      renderScoutingReportUI(
        nextEvent.opponent,
        gameState.opponents[nextEvent.opponent] || 70,
        nextEvent.format
      );
    } else if (nextEvent.type === "Tournament") {
      const avgOS = Math.round(
        Object.values(gameState.opponents).reduce((a, b) => a + b, 0) /
          Object.keys(gameState.opponents).length
      );
      renderScoutingReportUI(
        `${nextEvent.name} (Avg Opp Str: ${avgOS})`, // Modified name for clarity
        avgOS,
        nextEvent.format
      );
    }
  } else {
    renderScoutingReportUI(); // Clear scouting report if no more events
  }
}

function renderFinancesUI() {
  uiElements.facilitiesBudgetDisplay.textContent = gameState.budget.toFixed(2);
  uiElements.facilityLevelDisplay.textContent = gameState.facilityLevel;
  uiElements.coachLevelDisplay.textContent = gameState.coachLevel;
  uiElements.coachingInstituteLevelDisplay.textContent =
    gameState.coachingInstituteLevel || 1;
  uiElements.highPerformanceLevelDisplay.textContent =
    gameState.highPerformanceLevel || 1;

  const facCost = calculateUpgradeCost(gameState.facilityLevel);
  const coachCost = calculateUpgradeCost(gameState.coachLevel);
  const coachingInstituteCost = calculateUpgradeCost(
    gameState.coachingInstituteLevel || 1
  );
  const highPerformanceCost = calculateUpgradeCost(
    gameState.highPerformanceLevel || 1
  );

  uiElements.facilityUpgradeCost.textContent = facCost.toFixed(2);
  uiElements.coachUpgradeCost.textContent = coachCost.toFixed(2);
  uiElements.coachingInstituteUpgradeCost.textContent =
    coachingInstituteCost.toFixed(2);
  uiElements.highPerformanceUpgradeCost.textContent =
    highPerformanceCost.toFixed(2);

  // Add titles to disabled buttons explaining why
  const disableReason = (cost) =>
    gameState.budget < cost ? `Need $${cost.toFixed(1)}M` : "";

  uiElements.upgradeFacilityButton.disabled = gameState.budget < facCost;
  uiElements.upgradeFacilityButton.title = disableReason(facCost);

  uiElements.upgradeCoachButton.disabled = gameState.budget < coachCost;
  uiElements.upgradeCoachButton.title = disableReason(coachCost);

  uiElements.upgradeCoachingInstituteButton.disabled =
    gameState.budget < coachingInstituteCost;
  uiElements.upgradeCoachingInstituteButton.title = disableReason(
    coachingInstituteCost
  );

  uiElements.upgradeHighPerformanceButton.disabled =
    gameState.budget < highPerformanceCost;
  uiElements.upgradeHighPerformanceButton.title =
    disableReason(highPerformanceCost);
}

// --- Updated renderStadiumUpgradesUI ---
function renderStadiumUpgradesUI() {
  const list = uiElements.stadiumUpgradesList;
  if (!list) return;

  list.innerHTML = "";
  if (!gameState.stadiums) {
    list.innerHTML = "<li>No stadiums available.</li>";
    return;
  }

  // Add modern card styles with CSS
  const styleElement = document.createElement('style');
  styleElement.innerHTML = `
    .stadium-card {
      background: linear-gradient(145deg, #ffffff, #f0f0f0);
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
      margin-bottom: 24px;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .stadium-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 25px rgba(0,0,0,0.15);
    }
    
    .stadium-header {
      background: linear-gradient(90deg, #004d00, #008800);
      color: white;
      padding: 15px 20px;
      border-radius: 12px 12px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .stadium-content {
      padding: 20px;
    }
    
    .stadium-image {
      width: 100%;
      height: 180px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    
    .stadium-upgrades {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    
    .upgrade-button {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      background: white;
      border: none;
      border-radius: 8px;
      padding: 15px;
      height: 120px;
      text-align: center;
      transition: all 0.2s;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    
    .upgrade-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(0,0,0,0.1);
    }
    
    .upgrade-button:active:not(:disabled) {
      transform: translateY(1px);
    }
    
    .upgrade-name {
      font-weight: bold;
      font-size: 16px;
      color: #333;
      margin-bottom: 8px;
    }
    
    .upgrade-level {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    
    .upgrade-cost {
      font-size: 14px;
      font-weight: bold;
      color: #004d00;
    }
    
    .upgrade-button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .upgrade-button.max-level {
      background: linear-gradient(145deg, #f0f0f0, #e6e6e6);
    }
    
    .upgrade-button.max-level .upgrade-level {
      color: #004d00;
      font-weight: bold;
    }
    
    .upgrade-button.insufficient-funds {
      background: linear-gradient(145deg, #fff5f5, #fff0f0);
    }
    
    .upgrade-button.insufficient-funds .upgrade-cost {
      color: #cc0000;
    }
    
    .level-indicator {
      display: flex;
      justify-content: center;
      margin-top: 5px;
    }
    
    .level-dot {
      width: 8px;
      height: 8px;
      margin: 0 3px;
      border-radius: 50%;
      background-color: #ddd;
    }
    
    .level-dot.active {
      background-color: #004d00;
    }
  `;
  document.head.appendChild(styleElement);

  for (const stadiumKey in gameState.stadiums) {
    const stadium = gameState.stadiums[stadiumKey];
    
    // Create a modern card for each stadium
    const stadiumCard = document.createElement("div");
    stadiumCard.className = "stadium-card";
    
    // Create header with stadium name
    const stadiumHeader = document.createElement("div");
    stadiumHeader.className = "stadium-header";
    stadiumHeader.innerHTML = `<h3>${stadium.name || stadiumKey} Stadium</h3>`;
    
    // Create content container
    const stadiumContent = document.createElement("div");
    stadiumContent.className = "stadium-content";
    
    // Add stadium image
    const stadiumImage = document.createElement("img");
    stadiumImage.src = `images/stadium_${stadiumKey.toLowerCase()}.jpg`;
    stadiumImage.alt = `${stadiumKey} Stadium`;
    stadiumImage.className = "stadium-image";
    stadiumImage.onerror = function() { this.style.display = 'none'; };
    stadiumContent.appendChild(stadiumImage);
    
    // Create upgrade options container
    const upgradeOptions = document.createElement("div");
    upgradeOptions.className = "stadium-upgrades";
    
    // Create buttons for each feature
    if (stadium.features) {
      for (const featureKey in stadium.features) {
        const feature = stadium.features[featureKey];
        const currentLevel = feature.level || 0;
        const maxLevel = feature.maxLevel || 5;
        const displayName = feature.name || featureKey;
        
        // Calculate upgrade cost
        const baseCost = 5; // Base cost for stadium upgrades
        const cost = baseCost + (currentLevel * 2);
        
        // Create the modern button
        const button = document.createElement("button");
        button.className = "upgrade-button";
        
        // Create elements for button contents
        const nameElement = document.createElement("div");
        nameElement.className = "upgrade-name";
        nameElement.textContent = displayName;
        
        const levelElement = document.createElement("div");
        levelElement.className = "upgrade-level";
        
        const costElement = document.createElement("div");
        costElement.className = "upgrade-cost";
        
        // Create level indicator dots
        const levelIndicator = document.createElement("div");
        levelIndicator.className = "level-indicator";
        
        for (let i = 0; i < maxLevel; i++) {
          const dot = document.createElement("div");
          dot.className = i < currentLevel ? "level-dot active" : "level-dot";
          levelIndicator.appendChild(dot);
        }
        
        if (currentLevel >= maxLevel) {
          // Max level reached
          button.disabled = true;
          button.classList.add("max-level");
          levelElement.textContent = "MAXIMUM LEVEL";
          costElement.textContent = "";
        } else if (gameState.budget < cost) {
          // Not enough budget
          button.disabled = true;
          button.classList.add("insufficient-funds");
          levelElement.textContent = `Level ${currentLevel}/${maxLevel}`;
          costElement.textContent = `Need $${cost.toFixed(1)}M`;
        } else {
          // Can upgrade
          levelElement.textContent = `Level ${currentLevel}/${maxLevel}`;
          costElement.textContent = `Upgrade: $${cost.toFixed(1)}M`;
          button.onclick = function() {
            upgradeStadiumFeature(stadiumKey, featureKey);
          };
        }
        
        // Add elements to button
        button.appendChild(nameElement);
        button.appendChild(levelIndicator);
        button.appendChild(levelElement);
        button.appendChild(costElement);
        
        upgradeOptions.appendChild(button);
      }
    }
    
    stadiumContent.appendChild(upgradeOptions);
    stadiumCard.appendChild(stadiumHeader);
    stadiumCard.appendChild(stadiumContent);
    list.appendChild(stadiumCard);
  }
}

function renderHistoryUI() {
  const MAX_HISTORY = 20; // Match span in HTML
  uiElements.bilateralHistoryLimit.textContent = MAX_HISTORY;

  // Bilateral History
  uiElements.bilateralHistoryList.innerHTML = ""; // Clear
  if (gameState.bilateralHistory.length === 0) {
    uiElements.bilateralHistoryList.innerHTML =
      "<li>No bilateral series history yet.</li>";
  } else {
    // Show last N items
    const recentHistory = gameState.bilateralHistory.slice(-MAX_HISTORY);
    recentHistory.reverse().forEach((item) => {
      // Show most recent first
      const li = document.createElement("li");
      li.className = "history-item";
      let resultClass = "";
      let resultImage = "";

      if (item.result.includes("PAK wins")) {
        resultClass = "result-win";
        resultImage =
          '<img src="images/win.jpg" alt="Win" class="log-image" style="width: auto; height: auto; margin-right: 8px;">';
      } else if (
        item.result.includes("wins") &&
        !item.result.includes("PAK wins")
      ) {
        resultClass = "result-loss";
      } else {
        resultClass = "result-draw";
      }

      li.innerHTML = `
                ${resultImage}<span>${item.year}: ${item.format} vs ${item.opponent} (${item.location})</span>
                <span class="${resultClass}" style="margin-left: auto;">${item.result}</span>
            `;
      uiElements.bilateralHistoryList.appendChild(li);
    });
  }

  // Tournament Wins
  uiElements.tournamentWinsList.innerHTML = ""; // Clear
  if (gameState.tournamentWins.length === 0) {
    uiElements.tournamentWinsList.innerHTML =
      "<li>No major tournament wins yet.</li>";
  } else {
    gameState.tournamentWins.forEach((item) => {
      const li = document.createElement("li");
      li.className = "history-item result-win"; // Always a win here
      li.innerHTML = `<span>${item.year}: Won 🏆 ${item.name} (${item.format})</span>`;
      uiElements.tournamentWinsList.appendChild(li);
    });
  }
  updateScorecardSelector();
}

function updateScorecardSelector() {
  const selector = uiElements.scorecardSelector;
  
  // Exit if the old selector doesn't exist (we're using the new UI)
  if (!selector) {
    loadScorecards(); // Use the new UI update function instead
    return;
  }

  // Process for the old dropdown UI
  // Clear existing options except the first one
  while (selector.options.length > 1) {
    selector.remove(1);
  }

  let mostRecentMatchIndex = null;

  // Add an option for each match in history
  if (gameState.matchHistory && gameState.matchHistory.length > 0) {
    // Iterate backwards to show most recent first
    for (let i = gameState.matchHistory.length - 1; i >= 0; i--) {
      const match = gameState.matchHistory[i];
      const option = document.createElement("option");
      option.value = i; // Use index as value
      const date = new Date(match.scorecard.date).toLocaleDateString();
      option.text = `${date}: ${match.format} vs ${match.opponent} (${match.result})`;
      selector.add(option);

      // Store the index of the very first one added (which is the most recent match)
      if (mostRecentMatchIndex === null) {
        mostRecentMatchIndex = i;
      }
    }
  }

  // Add event listener if not already added
  if (!selector.hasAttribute("listener")) {
    selector.setAttribute("listener", "true");
    selector.addEventListener("change", function () {
      displayScorecard(this.value);
    });
  }

  // --- Automatically select and display the most recent match ---
  if (mostRecentMatchIndex !== null) {
    selector.value = mostRecentMatchIndex; // Set the selector value
    displayScorecard(mostRecentMatchIndex); // Display the scorecard
  } else {
    // If no history, ensure the default message is shown
    displayScorecard("");
    selector.value = ""; // Reset selector if no history
  }
}

function displayScorecard(index) {
  const container = document.getElementById("current-scorecard");
  if (!container) return;

  if (index === "" || index === null || index === undefined) {
    container.innerHTML = "<p>Select a match to view scorecard</p>";
    return;
  }

  const match = gameState.matchHistory[index];
  if (!match || !match.scorecard) {
    container.innerHTML = "<p>Match data not found for selected entry.</p>";
    return;
  }

  const scorecard = match.scorecard;

  // Create HTML for the scorecard
  let html = `
        <h3>${scorecard.format} Match vs ${match.opponent}</h3>
        <p>Date: ${new Date(scorecard.date).toLocaleDateString()}</p>
        <p>Venue: ${scorecard.location}</p>
        <p>Pitch: ${scorecard.pitchType}</p>
    `;

  if (scorecard.format === "Test") {
    // Test match has multiple innings
    html += displayTestMatchScorecard(scorecard, match.opponent);
  } else {
    // Limited overs match
    html += displayLimitedOversScorecard(scorecard, match.opponent);
  }

  html += `
        <div class="match-result ${
          scorecard.winner === "Pakistan"
            ? "result-win"
            : scorecard.winner === "Draw"
            ? "result-draw"
            : "result-loss"
        }">
            Result: ${scorecard.result}
        </div>
    `;

  container.innerHTML = html;
}

// This runs once the page is ready - Combines all initialization in one place
window.addEventListener("DOMContentLoaded", () => {
  // Title toggle initialization
  const titleToggle = document.getElementById("chairTitleToggle");
  const chairTitleElement = document.getElementById("chairTitle");
  const teamsTitleElement = document.getElementById("teamsTitle");

  // Read the existing preference from localStorage
  const savedTitlePref = localStorage.getItem("chairTitle");
  if (savedTitlePref === "Chairwoman") {
    chairTitleElement.textContent = "Pakistan Cricket Chairwoman";
    titleToggle.checked = true;
  }

  // Listen for changes on the toggle
  titleToggle.addEventListener("change", function () {
    if (this.checked) {
      chairTitleElement.textContent = "Pakistan Cricket Chairwoman";
      teamsTitleElement.textContent = "Chairwoman's Microsoft Teams";
      localStorage.setItem("chairTitle", "Chairwoman");
    } else {
      chairTitleElement.textContent = "Pakistan Cricket Chairman";
      teamsTitleElement.textContent = "Chairman's Microsoft Teams";
      localStorage.setItem("chairTitle", "Chairman");
    }
  });
  
  // Dark mode initialization and toggle
  const darkModeToggle = document.getElementById("darkModeToggle");
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    darkModeToggle.checked = true;
  }
  
  // Add event listener for dark mode toggle
  darkModeToggle.addEventListener("change", function() {
    document.body.classList.toggle("dark-mode");
    
    // Update match history timeline colors when dark mode changes
    if (gameState.matchHistory && gameState.matchHistory.length > 0) {
      updateMatchSelectorOptions(gameState.matchHistory);
    }
    
    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
    } else {
      localStorage.setItem("theme", "light");
    }
  });
  
  // Initialize the old dropdown selects if they exist
  initializeDropdowns();
  
  // Initialize the new UI components
  initializeSegmentedControls();
  initializeMatchSelector();
});

// Function to initialize the original dropdown selects
function initializeDropdowns() {
  // Pitch type select
  if (uiElements.pitchTypeSelect) {
    uiElements.pitchTypeSelect.addEventListener('change', function() {
      updateDomesticSetting('pitch', this.value);
    });
  }
  
  // Ball type select
  if (uiElements.ballTypeSelect) {
    uiElements.ballTypeSelect.addEventListener('change', function() {
      updateDomesticSetting('ball', this.value);
    });
  }
  
  // Bat type select
  if (uiElements.batTypeSelect) {
    uiElements.batTypeSelect.addEventListener('change', function() {
      updateDomesticSetting('bat', this.value);
    });
  }
}

// Segmented controls for Domestic Structure
function initializeSegmentedControls() {
  // Pitch type controls
  const pitchControl = document.getElementById('pitch-control');
  const pitchTypeSelect = document.getElementById('pitch-type');
  
  if (pitchControl) {
    pitchControl.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Update active state
        pitchControl.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update the value in the game state
        const value = this.getAttribute('data-value');
        updateDomesticSetting('pitch', value);
        
        // Update the hidden select element for compatibility
        if (pitchTypeSelect) {
          pitchTypeSelect.value = value;
        }
      });
    });
  }
  
  // Ball type controls
  const ballControl = document.getElementById('ball-control');
  const ballTypeSelect = document.getElementById('ball-type');
  
  if (ballControl) {
    ballControl.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Update active state
        ballControl.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update the value in the game state
        const value = this.getAttribute('data-value');
        updateDomesticSetting('ball', value);
        
        // Update the hidden select element for compatibility
        if (ballTypeSelect) {
          ballTypeSelect.value = value;
        }
      });
    });
  }
  
  // Bat type controls
  const batControl = document.getElementById('bat-control');
  const batTypeSelect = document.getElementById('bat-type');
  
  if (batControl) {
    batControl.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        // Update active state
        batControl.querySelectorAll('.segmented-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Update the value in the game state
        const value = this.getAttribute('data-value');
        updateDomesticSetting('bat', value);
        
        // Update the hidden select element for compatibility
        if (batTypeSelect) {
          batTypeSelect.value = value;
        }
      });
    });
  }
}

// Update segmented controls based on game state
function updateSegmentedControlsFromState() {
  // Update pitch control
  const pitchControl = document.getElementById('pitch-control');
  const pitchTypeSelect = document.getElementById('pitch-type');
  
  if (pitchControl && gameState.domesticSettings.pitch) {
    pitchControl.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-value') === gameState.domesticSettings.pitch) {
        btn.classList.add('active');
      }
    });
    
    // Update the hidden select element
    if (pitchTypeSelect) {
      pitchTypeSelect.value = gameState.domesticSettings.pitch;
    }
  }
  
  // Update ball control
  const ballControl = document.getElementById('ball-control');
  const ballTypeSelect = document.getElementById('ball-type');
  
  if (ballControl && gameState.domesticSettings.ball) {
    ballControl.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-value') === gameState.domesticSettings.ball) {
        btn.classList.add('active');
      }
    });
    
    // Update the hidden select element
    if (ballTypeSelect) {
      ballTypeSelect.value = gameState.domesticSettings.ball;
    }
  }
  
  // Update bat control
  const batControl = document.getElementById('bat-control');
  const batTypeSelect = document.getElementById('bat-type');
  
  if (batControl && gameState.domesticSettings.bat) {
    batControl.querySelectorAll('.segmented-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-value') === gameState.domesticSettings.bat) {
        btn.classList.add('active');
      }
    });
    
    // Update the hidden select element
    if (batTypeSelect) {
      batTypeSelect.value = gameState.domesticSettings.bat;
    }
  }
}

// Match selector for History
function initializeMatchSelector() {
  const toggleBtn = document.getElementById('match-selector-toggle');
  const dropdown = document.getElementById('match-selector-dropdown');
  
  if (!toggleBtn || !dropdown) return;
  
  // Toggle dropdown visibility
  toggleBtn.addEventListener('click', function() {
    const isExpanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', !isExpanded);
    dropdown.classList.toggle('visible');
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', function(event) {
    if (!event.target.closest('.match-selector-container')) {
      toggleBtn.setAttribute('aria-expanded', 'false');
      dropdown.classList.remove('visible');
    }
  });
}

// --- New Match Timeline UI ---
function updateMatchSelectorOptions(matches) {
  const container = document.getElementById('match-selector-dropdown');
  if (!container) return;
  
  // Clear the existing dropdown
  container.innerHTML = '';
  container.className = 'match-timeline-container';
  
  // Add a style for the timeline
  const timelineStyle = document.createElement('style');
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  // Define different styles based on dark mode state
  timelineStyle.innerHTML = `
    .match-timeline-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      background: ${isDarkMode ? '#1a1a2a' : '#f9f9f9'};
      border-radius: 8px;
      box-shadow: ${isDarkMode ? '0 2px 10px rgba(0,0,0,0.4)' : '0 2px 10px rgba(0,0,0,0.1)'};
      overflow: hidden;
      padding: 0;
    }
    
    .timeline-years {
      display: flex;
      overflow-x: auto;
      background: ${isDarkMode ? 'linear-gradient(to right, #0a0a1a, #00ff9d)' : 'linear-gradient(to right, #004d00, #008800)'};
      padding: 10px 15px;
      scrollbar-width: thin;
    }
    
    .timeline-years::-webkit-scrollbar {
      height: 5px;
    }
    
    .timeline-years::-webkit-scrollbar-thumb {
      background: ${isDarkMode ? 'rgba(0, 255, 157, 0.5)' : 'rgba(255,255,255,0.5)'};
      border-radius: 5px;
    }
    
    .year-button {
      min-width: 80px;
      padding: 8px 16px;
      margin-right: 10px;
      background: ${isDarkMode ? 'rgba(0, 255, 157, 0.2)' : 'rgba(255,255,255,0.2)'};
      border: none;
      border-radius: 20px;
      color: ${isDarkMode ? '#ffffff' : 'white'};
      font-weight: bold;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .year-button:hover {
      background: ${isDarkMode ? 'rgba(0, 255, 157, 0.3)' : 'rgba(255,255,255,0.3)'};
    }
    
    .year-button.active {
      background: ${isDarkMode ? '#00ff9d' : 'white'};
      color: ${isDarkMode ? '#0a0a1a' : '#004d00'};
    }
    
    .matches-container {
      padding: 15px;
      max-height: 300px;
      overflow-y: auto;
    }
    
    .matches-container::-webkit-scrollbar {
      width: 5px;
    }
    
    .matches-container::-webkit-scrollbar-thumb {
      background: ${isDarkMode ? '#3a3a4a' : '#ddd'};
      border-radius: 5px;
    }
    
    .year-matches {
      display: none;
    }
    
    .year-matches.active {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
    }
    
    .match-card {
      background: ${isDarkMode ? '#2a2a3a' : 'white'};
      border-radius: 8px;
      box-shadow: ${isDarkMode ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.08)'};
      padding: 15px;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 4px solid ${isDarkMode ? '#3a3a4a' : '#ddd'};
    }
    
    .match-card:hover {
      transform: translateY(-3px);
      box-shadow: ${isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.12)'};
    }
    
    .match-card.win {
      border-left-color: ${isDarkMode ? '#00ff9d' : '#28a745'};
    }
    
    .match-card.loss {
      border-left-color: ${isDarkMode ? '#ff4444' : '#dc3545'};
    }
    
    .match-card.draw {
      border-left-color: ${isDarkMode ? '#ffd700' : '#ffc107'};
    }
    
    .match-date {
      color: ${isDarkMode ? '#cccccc' : '#666'};
      font-size: 12px;
      margin-bottom: 6px;
    }
    
    .match-opponent {
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 6px;
      color: ${isDarkMode ? '#ffffff' : 'inherit'};
    }
    
    .match-format {
      background: ${isDarkMode ? '#1a1a2a' : '#f0f0f0'};
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 12px;
      display: inline-block;
      margin-bottom: 6px;
      color: ${isDarkMode ? '#ffffff' : 'inherit'};
    }
    
    .match-result {
      font-size: 12px;
      font-weight: bold;
    }
    
    .match-result.win {
      color: ${isDarkMode ? '#00ff9d' : '#28a745'};
      text-shadow: ${isDarkMode ? '0 0 5px rgba(0, 255, 157, 0.3)' : 'none'};
    }
    
    .match-result.loss {
      color: ${isDarkMode ? '#ff4444' : '#dc3545'};
      text-shadow: ${isDarkMode ? '0 0 5px rgba(255, 68, 68, 0.3)' : 'none'};
    }
    
    .match-result.draw {
      color: ${isDarkMode ? '#ffd700' : '#ffc107'};
      text-shadow: ${isDarkMode ? '0 0 5px rgba(255, 215, 0, 0.3)' : 'none'};
    }
    
    .no-matches {
      padding: 20px;
      text-align: center;
      color: ${isDarkMode ? '#cccccc' : '#666'};
    }
  `;
  document.head.appendChild(timelineStyle);
  
  // Remove original toggle button as we'll use a timeline now
  const toggleBtn = document.getElementById('match-selector-toggle');
  if (toggleBtn) {
    toggleBtn.parentNode.removeChild(toggleBtn);
  }
  
  // Get match-selector-header
  const headerContainer = document.querySelector('.match-selector-header');
  if (headerContainer) {
    headerContainer.innerHTML = '<h3>Match History Timeline</h3>';
  }
  
  if (!matches || matches.length === 0) {
    container.innerHTML = '<div class="no-matches">No matches available</div>';
    return;
  }
  
  // Create years container
  const yearsContainer = document.createElement('div');
  yearsContainer.className = 'timeline-years';
  
  // Create matches container
  const matchesContainer = document.createElement('div');
  matchesContainer.className = 'matches-container';
  
  // Get all unique years from matches and sort them
  const years = [...new Set(matches.map(match => 
    match.year || (match.scorecard?.date ? new Date(match.scorecard.date).getFullYear() : null)
  ))].filter(year => year !== null).sort();
  
  // Group matches by year
  const matchesByYear = {};
  years.forEach(year => {
    matchesByYear[year] = matches.filter(match => 
      match.year === year || 
      (match.scorecard?.date && new Date(match.scorecard.date).getFullYear() === year)
    );
  });
  
  // Create year buttons
  years.forEach((year, index) => {
    const yearBtn = document.createElement('button');
    yearBtn.className = index === 0 ? 'year-button active' : 'year-button';
    yearBtn.textContent = year;
    yearBtn.dataset.year = year;
    yearBtn.onclick = function() {
      document.querySelectorAll('.year-button').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.year-matches').forEach(div => div.classList.remove('active'));
      this.classList.add('active');
      document.querySelector(`.year-matches[data-year="${year}"]`).classList.add('active');
    };
    yearsContainer.appendChild(yearBtn);
  });
  
  // Create match cards for each year
  years.forEach((year, index) => {
    const yearMatchesDiv = document.createElement('div');
    yearMatchesDiv.className = index === 0 ? 'year-matches active' : 'year-matches';
    yearMatchesDiv.dataset.year = year;
    
    // Get all matches for this year and sort by date (most recent first)
    const yearMatches = matchesByYear[year];
    yearMatches.sort((a, b) => {
      const dateA = a.scorecard?.date ? new Date(a.scorecard.date) : new Date(0);
      const dateB = b.scorecard?.date ? new Date(b.scorecard.date) : new Date(0);
      return dateB - dateA; // Most recent first
    });
    
    yearMatches.forEach((match, matchIndex) => {
      const card = document.createElement('div');
      
      // Determine result class
      let resultClass = 'draw';
      if (match.result === 'Pakistan Win' || (match.scorecard && match.scorecard.winner === 'Pakistan')) {
        resultClass = 'win';
      } else if (match.result === 'Opponent Win' || (match.scorecard && match.scorecard.winner !== 'Pakistan' && match.scorecard.winner !== 'Draw')) {
        resultClass = 'loss';
      }
      
      card.className = `match-card ${resultClass}`;
      card.dataset.originalIndex = matches.indexOf(match);
      
      // Format date
      let dateText = 'Unknown date';
      if (match.scorecard && match.scorecard.date) {
        try {
          const dateObj = new Date(match.scorecard.date);
          if (!isNaN(dateObj.getTime())) {
            dateText = dateObj.toLocaleDateString();
          }
        } catch (e) {}
      } else if (match.date) {
        if (match.date instanceof Date) {
          dateText = match.date.toLocaleDateString();
        } else {
          try {
            const dateObj = new Date(match.date);
            if (!isNaN(dateObj.getTime())) {
              dateText = dateObj.toLocaleDateString();
            }
          } catch (e) {}
        }
      }
      
      const opponent = match.opponent || 'Unknown opponent';
      const format = match.format || (match.scorecard ? match.scorecard.format : 'match');
      
      // Get result
      let resultText = match.result || (match.scorecard ? match.scorecard.result : 'Unknown result');
      
      card.innerHTML = `
        <div class="match-date">${dateText}</div>
        <div class="match-opponent">vs ${opponent}</div>
        <div class="match-format">${format}</div>
        <div class="match-result ${resultClass}">${resultText}</div>
      `;
      
      card.addEventListener('click', function() {
        const selectedIndex = this.getAttribute('data-original-index');
        selectMatch(selectedIndex);
        
        // Highlight selected card
        document.querySelectorAll('.match-card').forEach(c => c.style.outline = '');
        this.style.outline = '2px solid #004d00';
      });
      
      yearMatchesDiv.appendChild(card);
    });
    
    matchesContainer.appendChild(yearMatchesDiv);
  });
  
  // Add components to container
  container.appendChild(yearsContainer);
  container.appendChild(matchesContainer);
  
  // Make the container visible
  container.classList.add('visible');
}

// Select a match from the timeline
function selectMatch(index) {
  // Call the original display function to show the scorecard
  displayScorecard(index);
}

// Modify the loadScorecards function to use our new UI
function loadScorecards() {
  // Get match history from game state
  const matches = gameState.matchHistory || [];
  
  // Update the match selector with available matches
  updateMatchSelectorOptions(matches);
}

function displayTestMatchScorecard(scorecard, opponentName) {
  let html = "";

  // Helper function to sanitize numeric values
  const sanitizeValue = (value) => {
    if (value === undefined || value === null || value === "" || Number.isNaN(value) || value === Infinity) {
      return "-";
    }
    return value;
  };

  // Helper to generate batting table rows
  const generateBattingRows = (performances) => {
    let rows = "";
    performances?.forEach((bat) => {
      const isExtra = bat.name === "Extras";
      rows += `
            <tr>
                <td>${bat.name} ${bat.dismissal === "Not Out" ? "*" : ""}</td>
                <td>${sanitizeValue(bat.runs)}</td>
                <td>${isExtra ? "-" : sanitizeValue(bat.balls)}</td>
                <td>${isExtra ? "-" : sanitizeValue(bat.fours)}</td>
                <td>${isExtra ? "-" : sanitizeValue(bat.sixes)}</td>
                <td>${isExtra ? "-" : sanitizeValue(bat.strikeRate)}</td>
                <td>${isExtra ? "" : bat.dismissal ?? ""}</td>
            </tr>
        `;
    });
    return rows;
  };

  // Helper to generate bowling table rows
  const generateBowlingRows = (bowling) => {
    let rows = "";
    bowling?.forEach((bowl) => {
      rows += `
              <tr>
                  <td>${bowl.name ?? "Unknown"}</td>
                  <td>${sanitizeValue(bowl.overs)}</td>
                  <td>${sanitizeValue(bowl.maidens)}</td>
                  <td>${sanitizeValue(bowl.runs)}</td>
                  <td>${sanitizeValue(bowl.wickets)}</td>
                  <td>${sanitizeValue(bowl.economy)}</td>
              </tr>
          `;
    });
    return rows;
  };

  // Pakistan innings
  for (let i = 0; i < scorecard.pakInnings?.length; i++) {
    const innings = scorecard.pakInnings[i];
    if (!innings) continue; // Skip if innings data is missing

    html += `
            <h4>Pakistan ${i === 0 ? "1st" : "2nd"} Innings: ${
      sanitizeValue(innings.totalRuns)
    }/${sanitizeValue(innings.wicketsLost)} (${
      sanitizeValue(innings.oversPlayed)
    } ov)</h4>
            ${innings.extras ? `<p>Extras: ${sanitizeValue(innings.extras)}</p>` : ""}
            <table class="scorecard-table">
                <tr>
                    <th>Batsman</th>
                    <th>Runs</th>
                    <th>Balls</th>
                    <th>4s</th>
                    <th>6s</th>
                    <th>SR</th>
                    <th>Dismissal</th>
                </tr>
                ${generateBattingRows(innings.performances)}
            </table>
        `;
  }

  // Opponent innings
  for (let i = 0; i < scorecard.oppInnings?.length; i++) {
    const innings = scorecard.oppInnings[i];
    if (!innings) continue; // Skip if innings data is missing

    html += `
            <h4>${opponentName} ${i === 0 ? "1st" : "2nd"} Innings: ${
      sanitizeValue(innings.totalRuns)
    }/${sanitizeValue(innings.wicketsLost)} (${
      sanitizeValue(innings.oversPlayed)
    } ov)</h4>
             ${innings.extras ? `<p>Extras: ${sanitizeValue(innings.extras)}</p>` : ""}
        `;

    // Show Pakistan's bowling figures against the opponent
    if (innings.bowling && innings.bowling.length > 0) {
      html += `
            <h5>Pakistan Bowling</h5>
            <table class="scorecard-table">
                <tr>
                    <th>Bowler</th>
                    <th>Overs</th>
                    <th>Maidens</th>
                    <th>Runs</th>
                    <th>Wickets</th>
                    <th>Econ</th>
                </tr>
                ${generateBowlingRows(innings.bowling)}
            </table>
        `;
    }

    // Optionally show opposition batting details if available
    if (innings.batting && innings.batting.length > 0) {
      html += `
                <h5>${opponentName} Batting</h5>
                <table class="scorecard-table">
                    <tr>
                        <th>Batsman</th>
                        <th>Runs</th>
                        <th>Balls</th>
                        <th>4s</th>
                        <th>6s</th>
                        <th>SR</th>
                        <th>Dismissal</th>
                    </tr>
                 ${generateBattingRows(innings.batting)}
            </table>
        `;
    }
  }

  return html;
}

function displayLimitedOversScorecard(scorecard, opponentName) {
  let html = "";

  // Reuse the same sanitize function
  const sanitizeValue = (value) => {
    if (value === undefined || value === null || value === "" || Number.isNaN(value) || value === Infinity) {
      return "-";
    }
    return value;
  };

  // Helper to generate batting table rows (same as in Test)
  const generateBattingRows = (performances) => {
    let rows = "";
    performances?.forEach((bat) => {
      const isExtra = bat.name === "Extras";
      rows += `
                <tr>
                    <td>${bat.name} ${
        bat.dismissal === "Not Out" ? "*" : ""
      }</td>
                    <td>${sanitizeValue(bat.runs)}</td>
                    <td>${isExtra ? "-" : sanitizeValue(bat.balls)}</td>
                    <td>${isExtra ? "-" : sanitizeValue(bat.fours)}</td>
                    <td>${isExtra ? "-" : sanitizeValue(bat.sixes)}</td>
                    <td>${isExtra ? "-" : sanitizeValue(bat.strikeRate)}</td>
                    <td>${isExtra ? "" : bat.dismissal ?? ""}</td>
                </tr>
            `;
    });
    return rows;
  };

  // Helper to generate bowling table rows (same as in Test)
  const generateBowlingRows = (bowling) => {
    let rows = "";
    bowling?.forEach((bowl) => {
      rows += `
                <tr>
                    <td>${bowl.name ?? "Unknown"}</td>
                    <td>${sanitizeValue(bowl.overs)}</td>
                    <td>${sanitizeValue(bowl.maidens)}</td>
                    <td>${sanitizeValue(bowl.runs)}</td>
                    <td>${sanitizeValue(bowl.wickets)}</td>
                    <td>${sanitizeValue(bowl.economy)}</td>
                </tr>
            `;
    });
    return rows;
  };

  // Determine who batted first
  const pakBattedFirst = scorecard.pakInnings?.oversPlayed !== undefined; // Simple check if pakInnings exists

  if (pakBattedFirst) {
    // Pakistan batted first
    const pakInnings = scorecard.pakInnings;
    html += `
            <h4>Pakistan Innings: ${sanitizeValue(pakInnings.totalRuns)}/${
      sanitizeValue(pakInnings.wicketsLost)
    } (${sanitizeValue(pakInnings.oversPlayed)} ov)</h4>
            ${pakInnings.extras ? `<p>Extras: ${sanitizeValue(pakInnings.extras)}</p>` : ""}
            <table class="scorecard-table">
                <tr><th>Batsman</th><th>Runs</th><th>Balls</th><th>4s</th><th>6s</th><th>SR</th><th>Dismissal</th></tr>
                ${generateBattingRows(pakInnings.performances)}
            </table>
        `;

    const oppInnings = scorecard.oppInnings;
    html += `
            <h4>${opponentName} Innings: ${sanitizeValue(oppInnings.totalRuns)}/${
      sanitizeValue(oppInnings.wicketsLost)
    } (${sanitizeValue(oppInnings.oversPlayed)} ov)</h4>
            ${oppInnings.extras ? `<p>Extras: ${sanitizeValue(oppInnings.extras)}</p>` : ""}
            <h5>Pakistan Bowling</h5>
            <table class="scorecard-table">
                <tr><th>Bowler</th><th>Overs</th><th>Maidens</th><th>Runs</th><th>Wickets</th><th>Econ</th></tr>
                ${generateBowlingRows(oppInnings.bowling)}
            </table>
        `;
    // Optionally show opposition batting
    if (oppInnings.batting && oppInnings.batting.length > 0) {
      html += `
                <h5>${opponentName} Batting</h5>
                <table class="scorecard-table">
                     <tr><th>Batsman</th><th>Runs</th><th>Balls</th><th>4s</th><th>6s</th><th>SR</th><th>Dismissal</th></tr>
                     ${generateBattingRows(oppInnings.batting)}
                </table>
            `;
    }
  } else {
    // Opponent batted first
    const oppInnings = scorecard.oppInnings;
    html += `
            <h4>${opponentName} Innings: ${sanitizeValue(oppInnings.totalRuns)}/${
      sanitizeValue(oppInnings.wicketsLost)
    } (${sanitizeValue(oppInnings.oversPlayed)} ov)</h4>
            ${oppInnings.extras ? `<p>Extras: ${sanitizeValue(oppInnings.extras)}</p>` : ""}
            <h5>Pakistan Bowling</h5>
            <table class="scorecard-table">
                <tr><th>Bowler</th><th>Overs</th><th>Maidens</th><th>Runs</th><th>Wickets</th><th>Econ</th></tr>
                ${generateBowlingRows(oppInnings.bowling)}
            </table>
        `;
    // Optionally show opposition batting
    if (oppInnings.batting && oppInnings.batting.length > 0) {
      html += `
                <h5>${opponentName} Batting</h5>
                <table class="scorecard-table">
                     <tr><th>Batsman</th><th>Runs</th><th>Balls</th><th>4s</th><th>6s</th><th>SR</th><th>Dismissal</th></tr>
                     ${generateBattingRows(oppInnings.batting)}
                </table>
            `;
    }

    const pakInnings = scorecard.pakInnings;
    html += `
            <h4>Pakistan Innings: ${sanitizeValue(pakInnings.totalRuns)}/${
      sanitizeValue(pakInnings.wicketsLost)
    } (${sanitizeValue(pakInnings.oversPlayed)} ov)</h4>
            ${pakInnings.extras ? `<p>Extras: ${sanitizeValue(pakInnings.extras)}</p>` : ""}
            <table class="scorecard-table">
                <tr><th>Batsman</th><th>Runs</th><th>Balls</th><th>4s</th><th>6s</th><th>SR</th><th>Dismissal</th></tr>
                ${generateBattingRows(pakInnings.performances)}
            </table>
        `;
  }

  return html;
}

// --- Updated renderScoutingReportUI ---
function renderScoutingReportUI(
  opponentName = null,
  opponentStrength = null,
  format = null
) {
  const contentDiv = uiElements.scoutingReportContent;
  if (!opponentName || !opponentStrength || !format) {
    contentDiv.innerHTML = `<p>Select "[NEXT]" event on Dashboard.</p>`;
    return;
  }

  let analysis = {
    overall: "",
    batting: [],
    bowling: [],
    fielding: "",
    keyPlayers: [],
  }; // Reset analysis

  // Extract base name if combined (e.g., "Tournament Pool (Avg:80)")
  const baseOpponentName = opponentName.includes("(")
    ? opponentName.substring(0, opponentName.indexOf("(")).trim()
    : opponentName;
  const isTournament = opponentName.includes("Tournament Pool");

  // Get actual opponent squad data (if available) for key players
  const opponentSquad = OPPONENT_SQUADS[baseOpponentName];
  if (opponentSquad && gameState.year <= 2032 && !isTournament) {
    // Use real data only for specific teams, not tournament pools
    analysis.keyPlayers = opponentSquad
      .sort((a, b) => (b.skill || 0) - (a.skill || 0)) // Sort by skill
      .slice(0, 4) // Take top 4
      .map((p) => ({ name: p.name, role: p.role, skill: p.skill || "N/A" })); // Map to report format
  } else {
    // Fallback to generic generation if data missing, past 2032, or tournament pool
    const numPlayers = isTournament ? 5 : 3; // Show more potential threats for tournament
    analysis.keyPlayers = generateKeyPlayers(
      baseOpponentName,
      opponentStrength,
      numPlayers,
      ["Batsman", "Bowler", "All-Rounder", "Wk-Batsman", "Spinner"] // Wider role variety
    );
  }

  // Overall Assessment
  if (opponentStrength >= 90)
    analysis.overall =
      "Elite opposition, operating at peak performance levels.";
  else if (opponentStrength >= 85)
    analysis.overall = "Formidable opponent; world-class talent evident.";
  else if (opponentStrength >= 78)
    analysis.overall =
      "Strong, well-drilled unit; requires our best performance.";
  else if (opponentStrength >= 70)
    analysis.overall =
      "Competitive side; clear strengths but defined areas to target.";
  else if (opponentStrength >= 60)
    analysis.overall =
      "Inconsistent performers; capable of surprises but vulnerable.";
  else
    analysis.overall =
      "Developing nation; significant advantage lies with Pakistan.";

  if (isTournament) {
    analysis.overall +=
      " Wide range of teams present, anticipate varied challenges.";
  }

  // Batting Analysis
  const batStrength = Math.min(
    99,
    Math.max(50, opponentStrength + Math.floor(Math.random() * 10) - 5)
  );
  if (batStrength >= 88)
    analysis.batting.push("Explosive batting lineup with depth and power.");
  else if (batStrength >= 80)
    analysis.batting.push(
      "Reliable top order, adept at building and accelerating innings."
    );
  else if (batStrength >= 70)
    analysis.batting.push(
      "Heavily reliant on 2-3 key individuals for significant scores."
    );
  else
    analysis.batting.push(
      "Batting unit susceptible to early breakthroughs and pressure."
    );
  // Format specific batting notes
  if (format === "T20")
    analysis.batting.push(
      "High boundary percentage and aggressive intent expected."
    );
  else if (format === "Test")
    analysis.batting.push(
      "Demonstrates patience and technique for long-form batting."
    );
  // ODI
  else
    analysis.batting.push(
      "Strong focus on rotating strike and building partnerships."
    );

  // Bowling Analysis
  const bowlStrength = Math.min(
    99,
    Math.max(50, opponentStrength + Math.floor(Math.random() * 10) - 5)
  );
  if (bowlStrength >= 88)
    analysis.bowling.push(
      "Diverse and potent attack; multiple wicket-taking threats."
    );
  else if (bowlStrength >= 80)
    analysis.bowling.push("Effective bowling unit with clear strike bowlers.");
  else if (bowlStrength >= 70)
    analysis.bowling.push(
      "Main threat comes from specific bowlers; others are manageable."
    );
  else
    analysis.bowling.push(
      "Bowling lacks consistent penetration; expect scoring opportunities."
    );
  // Format specific bowling notes
  if (format === "T20")
    analysis.bowling.push(
      "Death-bowling skills are a key performance indicator."
    );
  else if (format === "Test")
    analysis.bowling.push(
      "Sustained pressure and accuracy are their bowling hallmarks."
    );
  // ODI
  else
    analysis.bowling.push(
      "Tight lines and variations used effectively to control the run rate."
    );

  // Fielding Analysis
  const fieldStrength = Math.min(95, Math.max(55, opponentStrength - 2));
  if (fieldStrength >= 85)
    analysis.fielding =
      "Exceptional fielding standards; difficult to pierce the infield.";
  else if (fieldStrength >= 75)
    analysis.fielding = "Competent and reliable in the field.";
  else
    analysis.fielding =
      "Fielding can be exploited under pressure; anticipate errors.";

  // Construct HTML
  // Use the full opponentName (which might include Avg info for tournaments)
  let reportHTML = `<h4>Report: ${opponentName} - ${format}</h4>`;
  reportHTML += `<div class="scouting-section"><strong>Assessment:</strong><p>${analysis.overall}</p></div>`;
  reportHTML += `<div class="scouting-section"><strong>Batting (Est:${batStrength}):</strong><ul>${analysis.batting
    .map((s) => `<li>${s}</li>`)
    .join("")}</ul></div>`;
  reportHTML += `<div class="scouting-section"><strong>Bowling (Est:${bowlStrength}):</strong><ul>${analysis.bowling
    .map((w) => `<li>${w}</li>`)
    .join("")}</ul></div>`;
  reportHTML += `<div class="scouting-section"><strong>Fielding (Est:${fieldStrength}):</strong><p>${analysis.fielding}</p></div>`;
  if (analysis.keyPlayers.length > 0) {
    // Use "Key Players" or "Key Players (Fictional/Generic)" based on source
    const title =
      opponentSquad && gameState.year <= 2032 && !isTournament
        ? "Key Players"
        : isTournament
        ? "Potential Threats (Generic)"
        : "Key Players (Fictional/Generic)";
    reportHTML += `<div class="scouting-section"><strong>${title}:</strong><ul>${analysis.keyPlayers
      .map((p) => `<li>${p.name} (${p.role}) ~Skill:${p.skill}</li>`)
      .join("")}</ul></div>`;
  }
  contentDiv.innerHTML = reportHTML;
}

function generateKeyPlayers(opp, str, cnt, roles) {
  let ps = [];
  let uN = new Set();
  const bS = Math.max(65, str - 8);
  for (let i = 0; i < cnt; i++) {
    let fN, lN, fNa;
    let a = 0;
    do {
      fN =
        OPPONENT_FIRST_NAMES[
          Math.floor(Math.random() * OPPONENT_FIRST_NAMES.length)
        ];
      lN =
        OPPONENT_LAST_NAMES[
          Math.floor(Math.random() * OPPONENT_LAST_NAMES.length)
        ];
      fNa = `${fN} ${lN}`;
      a++;
    } while (uN.has(fNa) && a < 50); // Prevent infinite loops if names run out
    uN.add(fNa);
    const r = roles[i % roles.length]; // Cycle through roles
    const fl = Math.floor(Math.random() * 12) + 3; // Fluctuation
    const sk = Math.min(98, bS + fl); // Apply fluctuation to base skill
    ps.push({ name: fNa, role: r, skill: sk });
  }
  return ps;
}

function viewScoutingReport(event) {
  // Triggered when clicking on the 'NEXT' schedule item
  if (event && event.type === "Bilateral Series") {
    renderScoutingReportUI(
      event.opponent,
      gameState.opponents[event.opponent] || 70,
      event.format
    );
    openTab("scouting");
  } else if (event && event.type === "Tournament") {
    const avgOS = Math.round(
      Object.values(gameState.opponents).reduce((a, b) => a + b, 0) /
        Object.keys(gameState.opponents).length
    );
    renderScoutingReportUI(
      `${event.name} (Avg Opp Str: ${avgOS})`, // Modified name for clarity
      avgOS,
      event.format
    );
    openTab("scouting");
  } else {
    renderScoutingReportUI(); // Clear if no valid event
  }
}

function openTab(tabId) {
  uiElements.tabContents.forEach((t) => t.classList.remove("active"));
  uiElements.tabButtons.forEach((b) => b.classList.remove("active"));
  document.getElementById(tabId)?.classList.add("active");
  uiElements.tabsContainer
    .querySelector(`.tab-button[data-tab="${tabId}"]`)
    ?.classList.add("active");
}

function logMessageUI(message, imagePath = null, logType = "info") {
  const timestamp = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  let imgHTML = "";
  if (imagePath) {
    const fullPath = `images/${imagePath}`;
    // Basic error handling for missing images
    imgHTML = `<img src="${fullPath}" alt="" class="log-image" onerror="this.style.display='none';">`;
  }
  const entryHTML = `<div class="log-entry log-${logType}">${imgHTML}<span>[${timestamp}] ${message}</span></div>`;
  uiElements.messageLog.insertAdjacentHTML("afterbegin", entryHTML);

  // Limit log entries to prevent performance issues
  const maxLogs = 50;
  while (uiElements.messageLog.children.length > maxLogs) {
    uiElements.messageLog.removeChild(uiElements.messageLog.lastChild);
  }
}

// --- NEW Function to clear the log ---
function clearMessageLogUI() {
  uiElements.messageLog.innerHTML = "<p>Log cleared.</p>";
}

// --- NEW Fireworks Animation Function ---
function triggerFireworks() {
  const overlay = document.getElementById("fireworks-overlay");
  if (overlay) {
    overlay.style.display = "flex"; // Show the overlay
    // Hide after a delay (e.g., 3 seconds)
    setTimeout(() => {
      overlay.style.display = "none";
    }, 3000); // 3000 milliseconds = 3 seconds
  }
}

// --- New Dashboard Widget Functions ---

/**
 * Renders the Recent Results widget with the latest match/series results
 */
function renderRecentResultsWidget() {
  const container = uiElements.recentResultsContent;
  if (!container) return;
  
  // Get the last 2 items from match history
  const recentMatches = (gameState.matchHistory || []).slice(-2);
  
  if (recentMatches.length === 0) {
    container.innerHTML = "<p>No recent matches.</p>";
    return;
  }
  
  let html = '';
  
  recentMatches.forEach(match => {
    const resultClass = match.result === 'Won' ? 'result-win' : 
                        match.result === 'Lost' ? 'result-loss' : 'result-draw';
    const resultIcon = match.result === 'Won' ? 'win.gif' : 
                      match.result === 'Lost' ? 'loss.png' : 'draw.png';
    
    // For series, show series result, otherwise show match result
    const isSeries = match.matches && match.matches.length > 1;
    let resultText = '';
    
    if (isSeries) {
      // Count wins, losses, draws for series result
      const wins = match.matches.filter(m => m.result === 'Won').length;
      const losses = match.matches.filter(m => m.result === 'Lost').length;
      const draws = match.matches.filter(m => m.result === 'Draw').length;
      
      resultText = `Series vs ${match.opponent} (${match.format}): ${match.result} ${wins}-${losses}`;
      if (draws > 0) resultText += `-${draws}`;
      
      if (match.result === 'Won') resultText += ' 🏆';
    } else {
      resultText = `Match vs ${match.opponent} (${match.format}): ${match.result}`;
    }
    
    html += `
      <div class="result-item" onclick="openTab('history')">
        <img src="images/${resultIcon}" alt="${match.result}" class="result-icon">
        <span class="${resultClass}">${resultText}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Renders the Financial Summary widget with budget and last transaction
 */
function renderFinancialWidget() {
  if (!uiElements.widgetBudgetDisplay || !uiElements.widgetLastTransaction || !uiElements.financialContent) return;
  
  // Update the budget amount
  uiElements.widgetBudgetDisplay.textContent = gameState.budget.toFixed(2);
  
  // For last transaction, we need to track this somewhere
  // For now, let's show some sample data or placeholder
  // In a real implementation, we would need to track financial transactions
  
  // Calculate annual budget based on game state values
  const annualBudget = ANNUAL_BUDGET_INCREASE;
  const stadiumIncome = calculateStadiumIncome();
  const baseExpenses = BASE_ANNUAL_EXPENSES;
  
  // Create a sample last transaction
  let lastTransaction = "";
  let transactionClass = "";
  
  if (gameState.lastTransaction) {
    // If we have a tracked transaction
    lastTransaction = gameState.lastTransaction;
    transactionClass = gameState.lastTransaction.startsWith("+") ? "transaction-positive" : "transaction-negative";
  } else {
    // Default to showing annual budget income
    lastTransaction = `+${annualBudget.toFixed(1)}M Annual Budget`;
    transactionClass = "transaction-positive";
  }
  
  uiElements.widgetLastTransaction.textContent = lastTransaction;
  uiElements.widgetLastTransaction.className = transactionClass;
  
  // Add a click event to open finances tab
  uiElements.financialContent.onclick = () => openTab('facilities');
}

/**
 * Helper function to calculate total stadium income
 */
function calculateStadiumIncome() {
  let totalIncome = 0;
  if (gameState.stadiums) {
    for (const stadium of Object.values(gameState.stadiums)) {
      for (const feature of Object.values(stadium.features)) {
        totalIncome += feature.level * STADIUM_INCOME_PER_STAND_LEVEL;
      }
    }
  }
  return totalIncome;
}

/**
 * Renders the Player Watch widget with critical player updates
 */
function renderPlayerWatchWidget() {
  const container = uiElements.playerWatchContent;
  if (!container) return;
  
  // Get all players in the squad
  const squadPlayers = gameState.nationalSquadIDs
    .map(id => getPlayerById(id))
    .filter(p => p);
  
  // Look for players with issues or noteworthy changes
  const playerAlerts = [];
  
  // Check for unhappy/volatile players
  squadPlayers.forEach(player => {
    if (player.attitude === "Volatile") {
      playerAlerts.push({
        type: "critical",
        icon: "attitude_alert.gif",
        player: player,
        message: `ALERT: ${player.name} unhappy!`
      });
    }
  });
  
  // Check for potential improvements (this is a sample, you'd track this in game logic)
  squadPlayers.forEach(player => {
    // This is just an example - in a real implementation, track player improvements
    if (player.potential && player.potential > player.batting + 5 && player.role.includes("Bat")) {
      playerAlerts.push({
        type: "progress",
        icon: "success.png",
        player: player,
        message: `PROGRESS: ${player.name} showing potential!`
      });
    }
  });
  
  // Check for aging players (potential retirements)
  squadPlayers.forEach(player => {
    if (player.age >= RETIREMENT_AGE_THRESHOLD) {
      playerAlerts.push({
        type: "info",
        icon: "retired.png",
        player: player,
        message: `RETIREMENT: ${player.name} likely retiring end of year`
      });
    }
  });
  
  // If no alerts, show a default message
  if (playerAlerts.length === 0) {
    container.innerHTML = "<p>No critical player updates.</p>";
    return;
  }
  
  // Sort alerts by criticality
  playerAlerts.sort((a, b) => {
    const priority = { "critical": 0, "progress": 1, "info": 2 };
    return priority[a.type] - priority[b.type];
  });
  
  // Take just the top 3 alerts
  const topAlerts = playerAlerts.slice(0, 3);
  
  let html = '';
  topAlerts.forEach(alert => {
    html += `
      <div class="player-alert" onclick="openTab('squad')">
        <img src="images/${alert.icon}" alt="${alert.type}" class="alert-icon">
        <span class="alert-text alert-${alert.type}">${alert.message}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Renders the Pundit Corner widget with recent pundit quotes
 */
function renderPunditWidget() {
  const container = uiElements.punditContent;
  if (!container) return;
  
  // Get retired pundits if available
  const pundits = gameState.retiredPundits || [];
  
  if (pundits.length === 0) {
    container.innerHTML = "<p>No pundit opinions.</p>";
    return;
  }
  
  // Get 1-2 random pundits
  const selectedPundits = pundits.sort(() => 0.5 - Math.random()).slice(0, Math.min(2, pundits.length));
  
  let html = '';
  selectedPundits.forEach(pundit => {
    // Generate random quote based on team performance
    // In a real implementation, this would come from game events
    const quotes = [
      "Pakistan need to focus more on their batting lineup.",
      "The bowling attack is world-class, but consistency is lacking.",
      "Player fitness remains a concern for this team.",
      "The future looks bright with these young talents.",
      "More emphasis on domestic cricket is needed.",
      "Team selection has been questionable recently."
    ];
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const imgName = pundit.name.toLowerCase().replace(/ /g, "_") + ".jpg";
    
    html += `
      <div class="pundit-item">
        <img src="images/${imgName}" alt="${pundit.name}" class="pundit-avatar" onerror="this.style.display='none'">
        <div class="pundit-quote">"${randomQuote}"</div>
        <div class="pundit-name">- ${pundit.name}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/**
 * Displays a notification in the notifications area
 * @param {Object} options - Notification options
 * @param {string} options.title - Title of the notification
 * @param {string} options.message - Message content
 * @param {string} options.type - Type of notification (critical, success, info, warning)
 * @param {string} options.icon - Icon file name
 * @param {string} options.action - Optional action function name
 * @param {string} options.actionText - Optional action button text
 * @param {string} options.tabToOpen - Optional tab to open when notification is clicked
 */
function showNotification(options) {
  const container = uiElements.notificationsArea;
  if (!container) return;
  
  const id = 'notification-' + Date.now();
  const type = options.type || 'info';
  const icon = options.icon || `${type}.png`;
  
  let actionHtml = '';
  if (options.action && options.actionText) {
    actionHtml = `
      <div class="notification-action">
        <button onclick="${options.action}">${options.actionText}</button>
      </div>
    `;
  }
  
  const notificationHtml = `
    <div id="${id}" class="notification notification-${type}">
      <img src="images/${icon}" alt="" class="notification-icon">
      <div class="notification-content">
        <div class="notification-title">${options.title}</div>
        <div class="notification-message">${options.message}</div>
        ${actionHtml}
      </div>
      <button class="notification-close" onclick="dismissNotification('${id}')">&times;</button>
    </div>
  `;
  
  container.insertAdjacentHTML('afterbegin', notificationHtml);
  
  // If a tab is specified to open, add click handler
  if (options.tabToOpen) {
    const notificationElement = document.getElementById(id);
    if (notificationElement) {
      notificationElement.style.cursor = 'pointer';
      notificationElement.addEventListener('click', function(e) {
        // Don't trigger if they click the close button
        if (!e.target.matches('.notification-close')) {
          openTab(options.tabToOpen);
        }
      });
    }
  }
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    dismissNotification(id);
  }, 10000);
}

/**
 * Dismisses a notification by ID
 * @param {string} id - ID of the notification to dismiss
 */
function dismissNotification(id) {
  const notification = document.getElementById(id);
  if (notification) {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

// --- Override the original logMessageUI function to also check for notifications ---
const originalLogMessageUI = logMessageUI;
logMessageUI = function(message, imagePath = null, logType = "info") {
  // Call the original function first
  originalLogMessageUI(message, imagePath, logType);
  
  // Check if this log message should also trigger a notification
  if (logType === "attitude") {
    showNotification({
      title: "Player Attitude Alert",
      message: message,
      type: "critical",
      icon: "attitude_alert.gif",
      tabToOpen: "squad"
    });
  } else if (logType === "budget" && message.includes("-")) {
    showNotification({
      title: "Budget Warning",
      message: message,
      type: "warning",
      icon: "budget.png",
      tabToOpen: "facilities"
    });
  } else if (logType === "trophy") {
    showNotification({
      title: "Tournament Win!",
      message: message,
      type: "success",
      icon: "trophy.gif",
      tabToOpen: "history"
    });
  } else if (logType === "retirement") {
    showNotification({
      title: "Player Retirement",
      message: message,
      type: "info",
      icon: "retired.png",
      tabToOpen: "squad"
    });
  }
  
  // Update the dashboard widgets when there's a new message
  renderRecentResultsWidget();
  renderFinancialWidget();
  renderPlayerWatchWidget();
  renderPunditWidget();
}

// --- Set up a function to track financial transactions ---
function trackTransaction(amount, description) {
  const prefix = amount >= 0 ? "+" : "";
  gameState.lastTransaction = `${prefix}${amount.toFixed(1)}M ${description}`;
  
  // Re-render the financial widget
  renderFinancialWidget();
}

function setupEventListeners() {
  // Tab switching
  uiElements.tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.getAttribute("data-tab");
      openTab(tabId);
      
      // Initialize dashboard widgets when opening that tab
      if (tabId === "dashboard") {
        renderRecentResultsWidget();
        renderFinancialWidget();
        renderPlayerWatchWidget();
        renderPunditWidget();
      }
    });
  });
  
  // ... rest of event listeners ...
}

// Make dismissNotification globally accessible
window.dismissNotification = dismissNotification;

// Initialize widgets on window load
window.addEventListener('load', function() {
  // Render all widgets initially
  renderRecentResultsWidget();
  renderFinancialWidget();
  renderPlayerWatchWidget();
  renderPunditWidget();
});

// Make functions accessible to window scope
window.dismissNotification = dismissNotification;
window.upgradeStadiumFeature = function(stadiumKey, featureKey) {
  // Call the function from main.js
  upgradeStadiumFeature(stadiumKey, featureKey);
};
