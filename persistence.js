// scripts/persistence.js

const SAVE_KEY = "pakistanCricketChairmanSave_v1"; // Use new game name
const AUTO_SAVE_INTERVAL = 60000; // Auto-save every 60 seconds

function saveGame({ silent = false } = {}) {
  try {
    const saveData = {
      year: gameState.year,
      lastMajorTournamentYear: gameState.lastMajorTournamentYear,
      currentEventIndex: gameState.currentEventIndex,
      schedule: gameState.schedule,
      matchHistory: gameState.matchHistory, // Save match history
      nationalSquadIDs: gameState.nationalSquadIDs,
      domesticSettings: gameState.domesticSettings,
      trainingFocus: gameState.trainingFocus,
      currentHomePitchPrep: gameState.currentHomePitchPrep,
      currentRollerChoice: gameState.currentRollerChoice,
      budget: gameState.budget,
      facilityLevel: gameState.facilityLevel,
      coachLevel: gameState.coachLevel,
      coachingInstituteLevel: gameState.coachingInstituteLevel,
      highPerformanceLevel: gameState.highPerformanceLevel,
      stadiums: gameState.stadiums,
      bilateralHistory: gameState.bilateralHistory,
      tournamentWins: gameState.tournamentWins,
      retiredPundits: gameState.retiredPundits,
      playerListSnapshot: ALL_PLAYERS_DATA.map((p) => ({ ...p })),
      lastSaveTime: new Date().toISOString(), // Add timestamp for last save
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
    if (!silent) {
      logSuccess("Game Saved!");
    }
    return true;
  } catch (e) {
    console.error("Save Error:", e);
    if (!silent) {
      logError("Error saving.");
    }
    return false;
  }
}

// Auto-save function that will be called on an interval
function autoSave() {
  saveGame({ silent: true });
}

// Initialize auto-save timer
let autoSaveTimer = null;

// Start the auto-save timer
function startAutoSave() {
  // Clear any existing timer first
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
  
  // Set up new timer
  autoSaveTimer = setInterval(autoSave, AUTO_SAVE_INTERVAL);
  console.log("Auto-save started: saving every", AUTO_SAVE_INTERVAL / 1000, "seconds");
}

// Stop the auto-save timer
function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
    console.log("Auto-save stopped");
  }
}

function loadGame() {
  console.log("Checkpoint L1: loadGame started.");
  const savedDataJSON = localStorage.getItem(SAVE_KEY);
  if (savedDataJSON) {
    console.log("Checkpoint L2: Found saved data in localStorage.");
    try {
      console.log("Checkpoint L3: Attempting JSON.parse().");
      const savedData = JSON.parse(savedDataJSON);
      console.log("Checkpoint L4: JSON.parse() successful.");

      // Restore game state properties
      gameState.year = savedData.year;
      gameState.lastMajorTournamentYear = savedData.lastMajorTournamentYear;
      gameState.currentEventIndex = savedData.currentEventIndex;
      gameState.schedule = savedData.schedule;
      gameState.matchHistory = savedData.matchHistory || []; // Restore match history, default to empty array if missing
      gameState.nationalSquadIDs = savedData.nationalSquadIDs;
      gameState.domesticSettings = savedData.domesticSettings;
      gameState.trainingFocus = savedData.trainingFocus;
      gameState.currentHomePitchPrep = savedData.currentHomePitchPrep;
      gameState.currentRollerChoice = savedData.currentRollerChoice;
      gameState.budget = savedData.budget;
      gameState.facilityLevel = savedData.facilityLevel;
      gameState.coachLevel = savedData.coachLevel;

      // Add these two new properties with fallbacks to default values
      gameState.coachingInstituteLevel = savedData.coachingInstituteLevel || 1;
      gameState.highPerformanceLevel = savedData.highPerformanceLevel || 1;

      gameState.stadiums = savedData.stadiums;
      gameState.bilateralHistory = savedData.bilateralHistory;
      gameState.tournamentWins = savedData.tournamentWins;
      gameState.retiredPundits = savedData.retiredPundits;

      // Load Player List
      if (
        savedData.playerListSnapshot &&
        Array.isArray(savedData.playerListSnapshot)
      ) {
        ALL_PLAYERS_DATA.length = 0;
        ALL_PLAYERS_DATA.push(...savedData.playerListSnapshot);
        logInfo("Player roster loaded.");
        console.log("Checkpoint L6: Player roster loaded.");
      } else {
        logWarning("Save missing player list.");
        console.log("Checkpoint L6: Player roster *missing* in save.");
      }

      // Show when the save was created
      if (savedData.lastSaveTime) {
        const saveDate = new Date(savedData.lastSaveTime);
        logInfo(`Game loaded from save (last saved: ${saveDate.toLocaleString()})`);
      } else {
        logSuccess("Game Loaded Successfully!");
      }
      
      renderAllUI();
      console.log("Checkpoint L7: renderAllUI called from loadGame.");
      openTab("dashboard");
      
      // Start auto-save after loading
      startAutoSave();
      
      return true;
    } catch (error) {
      console.error("ERROR during loadGame try block:", error);
      logError("Failed to load save game. Starting new game.");
      localStorage.removeItem(SAVE_KEY);
      initializeGame(true); // Force reset
      return false;
    }
  } else {
    logInfo("No save game found.");
    console.log("Checkpoint L2: No saved data found.");
    initializeGame(true); // Start fresh if no save
    
    // Start auto-save for new game
    startAutoSave();
    
    return false;
  }
  console.log("Checkpoint L8: loadGame finished.");
}

function resetGame() {
  if (confirm("Reset game?")) {
    // Stop auto-save before resetting
    stopAutoSave();
    
    localStorage.removeItem(SAVE_KEY);
    logInfo("Game reset.");
    window.location.reload();
  }
}

// Start auto-save when window/tab is being closed to ensure game state is saved
window.addEventListener("beforeunload", function () {
  // Save game state before unloading
  saveGame({ silent: true });
});

// Auto-load on page load is handled by initializeGame() in main.js

function getDefaultTournamentYears() {
  return {
    "ICC Men's T20 World Cup": 2022,
    "ICC Men's Cricket World Cup": 2023,
    "ICC Champions Trophy": 2017,
    "Asia Cup": 2023,
    "ICC World Test Championship": 2023,
  };
}
// getInitialPundits is defined in players.js
