// --- Constants ---
const MAX_SQUAD_SIZE = 15;
const MAX_HISTORY_LENGTH = 20; // Bilateral series history limit
const BASE_UPGRADE_COST = 15;
const UPGRADE_COST_MULTIPLIER = 2.2;
const ANNUAL_BUDGET_INCREASE = 35; // Adjusted for balance
const STADIUM_INCOME_PER_STAND_LEVEL = 0.3; // Adjusted for balance
const WIN_BONUS_MULTIPLIER = 1.2; // Adjusted for balance
const BASE_ANNUAL_EXPENSES = 10;
const RETIREMENT_AGE_THRESHOLD = 36;
const MAX_PLAYER_AGE = 41;
const NEW_PLAYERS_PER_YEAR = 3;
const SIM_RANDOMNESS = 35; // General randomness factor in simulation (lower = more predictable)
const FITNESS_PENALTY_MULTIPLIER = 0.22; // How much low fitness impacts performance
const TEST_DRAW_CHANCE = 0.35; // Base probability of a draw in Tests (before considering match situation)
const RETIREMENT_BASE_CHANCE_FACTOR = 0.18; // Factor per year over threshold
const RETIREMENT_FITNESS_FACTOR = 220; // Higher fitness reduces chance less
const NEW_PLAYER_MIN_AGE = 17;
const NEW_PLAYER_AGE_RANGE = 4; // Max age = MIN + RANGE - 1 (17-20)
const VOLATILE_ATTITUDE_CHANCE = 0.15; // Base chance for volatile player event

// --- Game State ---
let gameState = getDefaultGameState();

// --- Default State ---
function getDefaultGameState() {
  return {
    year: 2025,
    lastMajorTournamentYear: getDefaultTournamentYears(),
    matchHistory: [], // Initialize match history
    currentEventIndex: 0,
    schedule: [],
    nationalSquadIDs: [],
    domesticSettings: {
      pitch: "Balanced",
      ball: "Kookaburra",
      bat: "Standard",
    },
    trainingFocus: {},
    currentHomePitchPrep: "balanced",
    currentRollerChoice: "standard",
    budget: 50.0,
    facilityLevel: 1,
    coachLevel: 1,
    coachingInstituteLevel: 1, // Added
    highPerformanceLevel: 1, // Added
    stadiums: getDefaultStadiumsState(),
    bilateralHistory: [],
    tournamentWins: [],
    retiredPundits: getInitialPundits(),
    opponents: {
      Australia: 92,
      England: 90,
      "New Zealand": 87,
      India: 93,
      "South Africa": 88,
      "Sri Lanka": 76,
      Bangladesh: 73,
      Afghanistan: 79,
      "West Indies": 77,
      Zimbabwe: 65,
      Ireland: 68,
    },
  };
}

// --- Utility & Logging ---
function getPlayerById(id) {
  return ALL_PLAYERS_DATA.find((p) => p.id === id);
}
// Logging functions using the UI bridge
function logInfo(m) {
  logMessageUI(m, null, "info");
}
function logSuccess(m) {
  logMessageUI(m, "success.png", "success");
}
function logWarning(m) {
  logMessageUI(m, "warning.png", "warning");
}
function logError(m) {
  logMessageUI(m, "error.png", "error");
}
function logWin(m) {
  logMessageUI(m, "win.gif", "win");
}
function logLoss(m) {
  logMessageUI(m, "loss.png", "loss");
}
function logDraw(m) {
  logMessageUI(m, "draw.png", "draw");
}
function logTrophy(m) {
  logMessageUI(m, "trophy.gif", "trophy");
}
function logBudget(m) {
  logMessageUI(m, "budget.png", "budget");
}
function logAttitude(m) {
  logMessageUI(m, "attitude_alert.gif", "attitude");
}
function logRetirement(m) {
  logMessageUI(m, "retired.png", "retirement");
}
function logPundit(m, img) {
  logMessageUI(m, img || "default_pundit.gif", "pundit");
}
// Fallback / Generic logger
function logMessage(m, i = null, t = "info") {
  logMessageUI(m, i, t);
}

// --- Game Logic (Selection, Training, etc.) ---
function selectPlayer(id) {
  if (
    gameState.nationalSquadIDs.length < MAX_SQUAD_SIZE &&
    !gameState.nationalSquadIDs.includes(id)
  ) {
    gameState.nationalSquadIDs.push(id);
    logInfo(
      `${getPlayerById(id)?.name || "Player"} selected for national squad.`
    );
    renderAllUI();
  } else if (gameState.nationalSquadIDs.length >= MAX_SQUAD_SIZE) {
    logWarning(`Cannot select: Squad is full (${MAX_SQUAD_SIZE} players).`);
  }
}
function deselectPlayer(id) {
  const index = gameState.nationalSquadIDs.indexOf(id);
  if (index > -1) {
    gameState.nationalSquadIDs.splice(index, 1);
    // Remove training focus if player is deselected
    delete gameState.trainingFocus[id];
    logInfo(
      `${getPlayerById(id)?.name || "Player"} deselected from national squad.`
    );
    renderAllUI();
  }
}
function setTrainingFocus(playerId, focus) {
  gameState.trainingFocus[playerId] = focus;
  logInfo(
    `Training focus for ${
      getPlayerById(playerId)?.name || "Player"
    } set to: ${focus}.`
  );
  // Re-render only the training list for efficiency
  renderTrainingListUI();
}
function updateDomesticSetting(setting, value) {
  if (gameState.domesticSettings.hasOwnProperty(setting)) {
    gameState.domesticSettings[setting] = value;
    logInfo(`Domestic setting updated - ${setting}: ${value}.`);
    renderDomesticSettingsUI(); // Re-render the domestic UI section
    // Optional: Image update already handled in renderDomesticSettingsUI
    // const imgEl = document.getElementById(`${setting}-image`);
    // if (imgEl) imgEl.src = `images/${setting}_${value}.png`;
  }
}
function clearSelections() {
  logInfo("National squad selection cleared.");
  gameState.nationalSquadIDs = [];
  gameState.trainingFocus = {}; // Also clear all training focuses
  renderAllUI(); // Update all relevant UI parts
}

/**
 * Calculates a merit score for a player based on role-weighted stats.
 * Used for auto-selection.
 */
function calculateMeritScore(p) {
  let score = 0;
  const primaryWeight = 2.0, // Weight for primary skill (bat/bowl)
    secondaryWeight = 0.5, // Weight for secondary skill
    fieldingWeight = 1.0,
    fitnessWeight = 0.3;

  score += (p.fielding || 0) * fieldingWeight;
  score += (p.fitness || 85) * fitnessWeight; // Use default fitness if undefined

  if (p.role.includes("Bat") || p.role.includes("Wk")) {
    score += (p.batting || 0) * primaryWeight;
    score += (p.bowling || 0) * secondaryWeight;
  } else if (p.role.includes("Bowl") || p.role.includes("Spin")) {
    score += (p.bowling || 0) * primaryWeight;
    score += (p.batting || 0) * secondaryWeight;
  } else if (p.role.includes("All")) {
    // For All-Rounders, slightly less weight on primary, more on secondary
    if ((p.batting || 0) >= (p.bowling || 0)) {
      // Batting primary AR
      score += (p.batting || 0) * (primaryWeight * 0.7);
      score += (p.bowling || 0) * (primaryWeight * 0.5); // Increased secondary weight
    } else {
      // Bowling primary AR
      score += (p.bowling || 0) * (primaryWeight * 0.7);
      score += (p.batting || 0) * (primaryWeight * 0.5);
    }
  } else {
    // Fallback for undefined roles?
    score += (p.batting || 0) + (p.bowling || 0);
  }
  return score;
}

function autoSelectSquad() {
  logInfo("Auto-selecting squad based on merit score...");
  const potentialPlayers = ALL_PLAYERS_DATA.filter(
    (p) => p.status !== "RetiredPundit"
  ) // Exclude retired players
    .map((p) => ({
      ...p,
      meritScore: calculateMeritScore(p),
    }));

  // Sort players by merit score in descending order
  potentialPlayers.sort((a, b) => b.meritScore - a.meritScore);

  // Select the top N players
  const bestSquad = potentialPlayers.slice(0, MAX_SQUAD_SIZE);
  gameState.nationalSquadIDs = bestSquad.map((p) => p.id);

  // Reset training focus when auto-selecting
  gameState.trainingFocus = {};

  logSuccess(
    `Auto-selected ${bestSquad.length} players for the national squad.`
  );
  renderAllUI(); // Update UI
}
function bulkTrainFielding() {
  if (gameState.nationalSquadIDs.length === 0) {
    logWarning("Cannot bulk train: No players in the national squad.");
    return;
  }
  logInfo("Setting bulk training focus to: Fielding");
  gameState.nationalSquadIDs.forEach((id) => {
    gameState.trainingFocus[id] = "fielding";
  });
  renderTrainingListUI(); // Update training list UI
}
function bulkTrainPrimaryRole() {
  if (gameState.nationalSquadIDs.length === 0) {
    logWarning("Cannot bulk train: No players in the national squad.");
    return;
  }
  logInfo("Setting bulk training focus to: Primary Role");
  gameState.nationalSquadIDs.forEach((id) => {
    const player = getPlayerById(id);
    if (player) {
      if (player.role.includes("Bat") || player.role.includes("Wk")) {
        gameState.trainingFocus[id] = "batting";
      } else if (player.role.includes("Bowl") || player.role.includes("Spin")) {
        gameState.trainingFocus[id] = "bowling";
      } else if (player.role.includes("All")) {
        // All-rounder: focus on the stronger skill
        gameState.trainingFocus[id] =
          (player.bowling || 0) > (player.batting || 0) ? "bowling" : "batting";
      } else {
        gameState.trainingFocus[id] = "rest"; // Fallback
      }
    }
  });
  renderTrainingListUI(); // Update training list UI
}
function bulkTrainFitness() {
  if (gameState.nationalSquadIDs.length === 0) {
    logWarning("Cannot bulk train: No players in the national squad.");
    return;
  }
  logInfo("Setting bulk training focus to: Fitness");
  gameState.nationalSquadIDs.forEach((id) => {
    gameState.trainingFocus[id] = "fitness";
  });
  renderTrainingListUI(); // Update training list UI
}

// --- Finances & Upgrades ---

/**
 * Calculates the cost to upgrade a facility/staff level based on the current level.
 * Uses exponential growth.
 */
function calculateUpgradeCost(currentLevel) {
  // Cost = Base * (Multiplier ^ (Level - 1))
  return (
    BASE_UPGRADE_COST * Math.pow(UPGRADE_COST_MULTIPLIER, currentLevel - 1)
  );
}

function upgradeFacilities() {
  const currentLevel = gameState.facilityLevel;
  const cost = calculateUpgradeCost(currentLevel);
  if (gameState.budget >= cost) {
    gameState.budget -= cost;
    trackTransaction(-cost, "Facility Upgrade");
    gameState.facilityLevel++;
    logSuccess(
      `Training facility upgraded to Level ${gameState.facilityLevel}! (Cost: $${cost}M)`
    );
    renderFinancesUI(); // Update UI
    updateStatusBarUI(); // Update status bar
    return true;
  } else {
    logWarning(
      `Cannot upgrade: Insufficient funds (Need: $${cost}M, Have: $${gameState.budget.toFixed(
        1
      )}M)`
    );
    return false;
  }
}

function upgradeCoachingInstitute() {
  const currentLevel = gameState.coachingInstituteLevel;
  const cost = calculateUpgradeCost(currentLevel) * 0.7; // Slightly cheaper than main facility
  if (gameState.budget >= cost) {
    gameState.budget -= cost;
    trackTransaction(-cost, "Coaching Institute Upgrade");
    gameState.coachingInstituteLevel++;
    logSuccess(
      `Coaching Institute upgraded to Level ${gameState.coachingInstituteLevel}! (Cost: $${cost.toFixed(
        1
      )}M)`
    );
    renderFinancesUI(); // Update UI
    updateStatusBarUI(); // Update status bar
    return true;
  } else {
    logWarning(
      `Cannot upgrade: Insufficient funds (Need: $${cost.toFixed(
        1
      )}M, Have: $${gameState.budget.toFixed(1)}M)`
    );
    return false;
  }
}

function upgradeHighPerformance() {
  const currentLevel = gameState.highPerformanceLevel;
  const cost = calculateUpgradeCost(currentLevel) * 0.75; // Slightly cheaper than main facility
  if (gameState.budget >= cost) {
    gameState.budget -= cost;
    trackTransaction(-cost, "High Performance Center Upgrade");
    gameState.highPerformanceLevel++;
    logSuccess(
      `High Performance Center upgraded to Level ${
        gameState.highPerformanceLevel
      }! (Cost: $${cost.toFixed(1)}M)`
    );
    renderFinancesUI(); // Update UI
    updateStatusBarUI(); // Update status bar
    return true;
  } else {
    logWarning(
      `Cannot upgrade: Insufficient funds (Need: $${cost.toFixed(
        1
      )}M, Have: $${gameState.budget.toFixed(1)}M)`
    );
    return false;
  }
}

function upgradeCoaching() {
  const currentLevel = gameState.coachLevel;
  const cost = calculateUpgradeCost(currentLevel) * 0.8; // Slightly cheaper than main facility
  if (gameState.budget >= cost) {
    gameState.budget -= cost;
    trackTransaction(-cost, "Coach Upgrade");
    gameState.coachLevel++;
    logSuccess(
      `Coaching staff upgraded to Level ${gameState.coachLevel}! (Cost: $${cost.toFixed(
        1
      )}M)`
    );
    renderFinancesUI(); // Update UI
    updateStatusBarUI(); // Update status bar
    return true;
  } else {
    logWarning(
      `Cannot upgrade: Insufficient funds (Need: $${cost.toFixed(
        1
      )}M, Have: $${gameState.budget.toFixed(1)}M)`
    );
    return false;
  }
}

function upgradeStadiumFeature(stadiumName, feature) {
  if (!gameState.stadiums[stadiumName]?.features?.[feature]) {
    logError(`Stadium ${stadiumName} or feature ${feature} not found.`);
    return false;
  }

  const featureObj = gameState.stadiums[stadiumName].features[feature];
  const currentLevel = featureObj.level || 0;
  const maxLevel = featureObj.maxLevel || 5;

  if (currentLevel >= maxLevel) {
    logWarning(`${feature} at ${stadiumName} is already at max level!`);
    return false;
  }

  const baseCost = 5; // Base cost for stadium upgrades
  const cost = baseCost + (currentLevel * 2);

  if (gameState.budget >= cost) {
    gameState.budget -= cost;
    trackTransaction(-cost, `${stadiumName} ${feature} Upgrade`);
    
    featureObj.level = currentLevel + 1;
    logSuccess(
      `${feature} at ${stadiumName} upgraded to Level ${
        featureObj.level
      }! (Cost: $${cost.toFixed(1)}M)`
    );
    
    renderStadiumUpgradesUI();
    updateStatusBarUI();
    return true;
  } else {
    logWarning(
      `Cannot upgrade: Insufficient funds (Need: $${cost.toFixed(
        1
      )}M, Have: $${gameState.budget.toFixed(1)}M)`
    );
    return false;
  }
}

/**
 * Updates the annual budget based on income (base, stadiums, facilities)
 * and expenses (base, maintenance based on facility/staff levels).
 * Should be called once per year, typically after the schedule completes.
 * @param {number} matchWins - Number of match wins in the completed year (for bonus income).
 */
function updateBudget(matchWins = 0) {
  // --- Annual income calculations ---
  const baseIncome = ANNUAL_BUDGET_INCREASE;
  let matchBonuses = 0;
  let stadiumIncome = 0;

  // Calculate stadium income from all stadiums
  for (const stadiumName in gameState.stadiums) {
    const stadium = gameState.stadiums[stadiumName];
    for (const featureName in stadium.features) {
      const feature = stadium.features[featureName];
      stadiumIncome += feature.level * STADIUM_INCOME_PER_STAND_LEVEL;
    }
  }

  // Calculate win bonuses
  if (matchWins > 0) {
    matchBonuses = matchWins * WIN_BONUS_MULTIPLIER;
  }

  // --- Annual expenses calculations ---
  const baseExpenses = BASE_ANNUAL_EXPENSES;
  let facilityMaintenance = 0;

  // Calculate facility maintenance costs
  facilityMaintenance += gameState.facilityLevel * 0.5;
  facilityMaintenance += gameState.coachLevel * 0.5;
  facilityMaintenance += gameState.coachingInstituteLevel * 0.5;
  facilityMaintenance += gameState.highPerformanceLevel * 0.5;

  // Apply calculations to budget
  const prevBudget = gameState.budget;
  gameState.budget += baseIncome;
  // Track the annual budget income
  trackTransaction(baseIncome, "Annual Budget");
  
  if (stadiumIncome > 0) {
    gameState.budget += stadiumIncome;
    // Track stadium income
    trackTransaction(stadiumIncome, "Stadium Revenue");
  }
  
  if (matchBonuses > 0) {
    gameState.budget += matchBonuses;
    // Track match bonuses
    trackTransaction(matchBonuses, "Win Bonuses");
  }
  
  if (baseExpenses > 0) {
    gameState.budget -= baseExpenses;
    // Track basic expenses
    trackTransaction(-baseExpenses, "Basic Expenses");
  }
  
  if (facilityMaintenance > 0) {
    gameState.budget -= facilityMaintenance;
    // Track maintenance costs
    trackTransaction(-facilityMaintenance, "Facility Maintenance");
  }

  // Round to 2 decimal places for display
  gameState.budget = Math.round(gameState.budget * 100) / 100;

  // Log budget changes
  let budgetChangeMsg = `Annual Budget Update: $${prevBudget.toFixed(
    1
  )}M → $${gameState.budget.toFixed(1)}M`;

  // Add budget breakdown details
  budgetChangeMsg += `\nIncome: +$${baseIncome.toFixed(
    1
  )}M Budget, +$${stadiumIncome.toFixed(1)}M Stadiums`;
  if (matchBonuses > 0) {
    budgetChangeMsg += `, +$${matchBonuses.toFixed(1)}M Win Bonuses`;
  }
  budgetChangeMsg += `\nExpenses: -$${baseExpenses.toFixed(
    1
  )}M Basic, -$${facilityMaintenance.toFixed(1)}M Facilities`;

  logBudget(budgetChangeMsg);
  return gameState.budget;
}

// --- Player Progression & Management ---

/**
 * Applies annual training effects to national players based on focus
 * and development to domestic players based on domestic settings,
 * facilities, and potential. Also handles fitness and weight changes.
 * Updates player stats directly in ALL_PLAYERS_DATA.
 */
function applyTrainingAndDevelopment() {
  logInfo("Applying annual training & development effects...");
  let changesMade = false; // Track if any stats actually changed
  const FITNESS_GAIN_RATE = 2.5; // Base fitness points gained per year if focused
  const WEIGHT_CHANGE_PER_FITNESS_LBS = 0.55; // How many lbs weight changes per fitness point change
  const TARGET_FITNESS_FOR_WEIGHT_LOSS = 85; // Players above this fitness might lose weight
  const MIN_WEIGHT_LBS = 130; // Minimum player weight

  // Multipliers based on facility levels
  const coachMultiplier = 1 + (gameState.coachLevel - 1) * 0.05;
  const facilityMultiplier = 1 + (gameState.facilityLevel - 1) * 0.03;
  const coachInstMultiplier =
    1 + ((gameState.coachingInstituteLevel || 1) - 1) * 0.04;
  const highPerfMultiplier =
    1 + ((gameState.highPerformanceLevel || 1) - 1) * 0.05;

  ALL_PLAYERS_DATA.forEach((p) => {
    // Skip retired players
    if (p.status === "RetiredPundit") return;

    // Ensure player has default stats if missing (safety check)
    p.fitness = p.fitness ?? 85;
    p.potential = p.potential ?? 75;
    p.batting = p.batting ?? 50;
    p.bowling = p.bowling ?? 50;
    p.fielding = p.fielding ?? 50;
    p.weightLbs = p.weightLbs ?? 165;

    let trainingBoost = 0; // Base points gain before multipliers/potential gap
    let skillToTrain = null; // Which skill (batting, bowling, fielding, fitness)
    let developmentRate = 0.1 * facilityMultiplier; // Base dev rate for domestic players
    let focusMultiplier = 1.5; // Extra boost if domestic settings align with skill

    // --- Determine Training/Development Focus ---
    if (gameState.nationalSquadIDs.includes(p.id)) {
      // --- National Squad: Apply focused training ---
      const focus = gameState.trainingFocus[p.id];
      if (focus && focus !== "rest") {
        skillToTrain = focus;
        if (focus === "fitness") {
          // Fitness has a specific gain rate, also affected by HP institute
          trainingBoost = FITNESS_GAIN_RATE * highPerfMultiplier;
        } else {
          // Skill training boost affected by coach and HP institute
          trainingBoost =
            (Math.random() * 1.5 + 0.5) * coachMultiplier * highPerfMultiplier;
        }
      }
    } else {
      // --- Domestic Player: Apply general development based on settings ---
      developmentRate += Math.random() * 0.2 - 0.1; // Add base randomness
      developmentRate *= coachInstMultiplier; // Boost from Coaching Institute

      // Check if domestic ball type particularly boosts bowlers
      const bowlBoostBall =
        gameState.domesticSettings.ball === "dukes" ||
        gameState.domesticSettings.ball === "sgtest";

      // Adjust overall development rate based on domestic settings compatibility with player role
      switch (gameState.domesticSettings.pitch) {
        case "batting":
          developmentRate *=
            p.role.includes("Bat") || p.role.includes("Wk") ? 1.2 : 0.9;
          break;
        case "bowling":
          developmentRate *=
            p.role.includes("Bowl") || p.role.includes("Spin") ? 1.2 : 0.9;
          break;
      }
      switch (gameState.domesticSettings.ball) {
        case "dukes":
          developmentRate *= p.role.includes("Fast") ? 1.1 : 1.0;
          break;
        case "sgtest":
          developmentRate *= p.role.includes("Spin") ? 1.1 : 1.0;
          break;
      }
      switch (gameState.domesticSettings.bat) {
        case "power_hitting":
          developmentRate *=
            p.role.includes("Bat") || p.role.includes("Wk") ? 1.1 : 1.0;
          break;
        case "traditional":
          developmentRate *=
            p.role.includes("Bowl") || p.role.includes("Spin") ? 1.05 : 0.95;
          break;
      }

      // Base boost for domestic development
      trainingBoost = Math.random() * developmentRate;

      // Determine which skill improves for domestic player, apply focus multiplier if settings match
      if (
        Math.random() < 0.5 &&
        (p.role.includes("Bat") ||
          p.role.includes("All") ||
          p.role.includes("Wk"))
      ) {
        skillToTrain = "batting";
        if (
          gameState.domesticSettings.pitch === "batting" ||
          gameState.domesticSettings.bat === "power_hitting"
        ) {
          trainingBoost *= focusMultiplier; // Apply multiplier if settings favor batting
        }
      } else if (
        Math.random() < 0.7 &&
        (p.role.includes("Bowl") ||
          p.role.includes("All") ||
          p.role.includes("Spin"))
      ) {
        skillToTrain = "bowling";
        if (gameState.domesticSettings.pitch === "bowling" || bowlBoostBall) {
          trainingBoost *= focusMultiplier; // Apply multiplier if settings favor bowling
        }
      } else {
        skillToTrain = "fielding"; // Default to fielding if not batting/bowling
      }

      // Small independent chance for domestic fitness improvement
      if (Math.random() < 0.05) {
        skillToTrain = "fitness";
        trainingBoost =
          Math.random() * (FITNESS_GAIN_RATE / 2) * facilityMultiplier; // Fitness gain slower domestically
      }
    } // End Domestic Development

    // --- Apply Skill/Fitness Gains ---
    if (skillToTrain && trainingBoost > 0) {
      const currentStat = p[skillToTrain];
      const maxStat = skillToTrain === "fitness" ? 100 : p.potential; // Fitness max 100, skills max potential

      if (currentStat < maxStat) {
        let actualGain = 0;
        // Calculate gain differently for fitness vs skills
        if (skillToTrain === "fitness") {
          actualGain = Math.round(trainingBoost * 10) / 10; // Direct gain for fitness
          actualGain = Math.max(0.1, actualGain); // Ensure at least minimal gain
        } else {
          // Skill gain is reduced based on how close the player is to their potential
          const gap = maxStat - currentStat;
          // Use sqrt for diminishing returns as gap shrinks
          const potentialMultiplier = Math.max(0.1, Math.sqrt(gap / 100));
          actualGain =
            Math.round(trainingBoost * potentialMultiplier * 10) / 10;
          actualGain = Math.max(0.1, actualGain); // Ensure at least minimal gain
        }

        const oldStat = p[skillToTrain];
        // Apply the gain, capped by the maximum allowed value
        p[skillToTrain] = Math.min(
          maxStat,
          Math.round((currentStat + actualGain) * 10) / 10
        );

        // Track if a change occurred and handle weight change for fitness
        if (p[skillToTrain] > oldStat) {
          changesMade = true;
          if (skillToTrain === "fitness") {
            // --- Adjust Weight Based on Fitness Change ---
            const fitnessChange = p[skillToTrain] - oldStat;
            let weightChange = 0;
            if (
              fitnessChange > 0 &&
              p.fitness > TARGET_FITNESS_FOR_WEIGHT_LOSS
            ) {
              // Gained fitness while already fit -> lose weight
              weightChange = -Math.abs(
                fitnessChange * WEIGHT_CHANGE_PER_FITNESS_LBS
              );
            } else if (fitnessChange < 0) {
              // Lost fitness -> gain weight
              weightChange = Math.abs(
                fitnessChange * WEIGHT_CHANGE_PER_FITNESS_LBS
              );
            }
            p.weightLbs = Math.max(
              MIN_WEIGHT_LBS,
              Math.round(p.weightLbs + weightChange)
            );
          }
        }
      }
    }

    // --- Potential Increase ---
    // Small chance for potential to increase, boosted by facility level
    if (Math.random() < 0.01 * facilityMultiplier && p.potential < 99) {
      p.potential = Math.min(99, p.potential + 1);
      // Log potential increases as they are rare and significant
      logSuccess(
        `Potential Increased! ${p.name} potential now ${p.potential}.`
      );
      changesMade = true;
    }
  }); // End forEach player

  if (changesMade) {
    logInfo("Player development and training effects applied.");
  } else {
    logInfo("No significant player stat changes this year.");
  }
}

/**
 * Handles player aging and checks for retirements at the end of each year.
 * Retired players have their status updated and may become pundits.
 */
function handleRetirementsAndAging() {
  logInfo("Processing player aging and checking for retirements...");
  const retiredPlayers = [];

  for (let i = ALL_PLAYERS_DATA.length - 1; i >= 0; i--) {
    // Iterate backwards for safe removal/modification
    const player = ALL_PLAYERS_DATA[i];

    // Skip already retired players
    if (player.status === "RetiredPundit") continue;

    // Increment age
    player.age++;

    let retirementChance = 0;
    // --- Calculate Retirement Chance ---
    if (player.age >= MAX_PLAYER_AGE) {
      retirementChance = 1.0; // Guaranteed retirement at max age
    } else if (player.age >= RETIREMENT_AGE_THRESHOLD) {
      // Calculate base chance based on how far past the threshold they are
      retirementChance =
        (player.age - RETIREMENT_AGE_THRESHOLD + 1) *
        RETIREMENT_BASE_CHANCE_FACTOR;
      // Reduce chance based on fitness (higher fitness = less likely to retire)
      // Ensure fitness exists, default to 85 if not
      retirementChance *=
        1 - (player.fitness || 85) / RETIREMENT_FITNESS_FACTOR;
      // Ensure chance is not negative
      retirementChance = Math.max(0, retirementChance);
    }

    // --- Check for Retirement ---
    if (Math.random() < retirementChance) {
      retiredPlayers.push(player.name);
      logRetirement(
        `${player.name} (Age: ${player.age}) has retired from professional cricket.`
      );
      player.status = "RetiredPundit"; // Update status

      // Remove from national squad if selected
      const squadIndex = gameState.nationalSquadIDs.indexOf(player.id);
      if (squadIndex > -1) {
        gameState.nationalSquadIDs.splice(squadIndex, 1);
      }
      // Remove any training focus
      delete gameState.trainingFocus[player.id];

      // Add to pundit list if not already there
      if (
        !gameState.retiredPundits.some((pundit) => pundit.name === player.name)
      ) {
        // Determine pundit type based on attitude
        const punditType =
          player.attitude === "Volatile"
            ? "Outspoken"
            : player.attitude === "Professional"
            ? "Analytical"
            : "Balanced"; // Default

        // Generate a plausible image filename (needs corresponding files)
        const imageFile = `pundit_${player.name
          .split(" ")
          .pop()
          .toLowerCase()}.jpg`; // e.g., pundit_akram.jpg

        gameState.retiredPundits.push({
          name: player.name,
          type: punditType,
          imageFile: imageFile, // Store image filename
        });
        logInfo(
          `${player.name} has joined the punditry team as a ${punditType} voice.`
        );
      }
    }
  } // End loop through players

  if (retiredPlayers.length === 0) {
    logInfo("No players retired this year.");
  }
}

// Player name lists for generation
const FIRST_NAMES = [
  "Ahmed",
  "Ali",
  "Hassan",
  "Bilal",
  "Faisal",
  "Imran",
  "Kamran",
  "Mohammad",
  "Noman",
  "Osman",
  "Qasim",
  "Rashid",
  "Saad",
  "Tariq",
  "Usman",
  "Waqas",
  "Yasir",
  "Zain",
  "Abdullah",
  "Abrar",
  "Adil",
  "Arshad",
  "Asif",
  "Basit",
  "Danish",
  "Faheem",
  "Ghulam",
  "Haris",
  "Ibrahim",
  "Junaid",
  "Khalid",
  "Mehran",
  "Nadeem",
  "Omair",
  "Rizwan",
  "Sami",
  "Talha",
  "Wahab",
  "Yousuf",
  "Zubair",
];
const LAST_NAMES = [
  "Khan",
  "Ahmed",
  "Ali",
  "Raja",
  "Malik",
  "Butt",
  "Sheikh",
  "Chaudhry",
  "Qureshi",
  "Mirza",
  "Siddiqui",
  "Abbasi",
  "Mughal",
  "Awan",
  "Baig",
  "Shah",
  "Hussain",
  "Mehmood",
  "Iqbal",
  "Anwar",
  "Javed",
  "Nawaz",
  "Sharif",
  "Bhatti",
  "Rana",
  "Gondal",
  "Warraich",
  "Gillani",
  "Leghari",
];

/**
 * Generates a specified number of new young players and adds them to the
 * domestic pool (ALL_PLAYERS_DATA). Stats are based on potential and randomness.
 */
function generateNewPlayers() {
  logInfo(
    `Generating ${NEW_PLAYERS_PER_YEAR} new prospects for the domestic pool...`
  );
  const currentMaxId = ALL_PLAYERS_DATA.reduce(
    (max, p) => Math.max(max, p.id),
    0
  );
  const ROLES = [
    "Batsman",
    "Fast Bowler",
    "Spinner",
    "All-Rounder",
    "Wk-Batsman",
  ];
  const ATTITUDES = ["Professional", "Neutral", "Volatile"]; // Attitude codes mapped to strings

  for (let i = 0; i < NEW_PLAYERS_PER_YEAR; i++) {
    const newId = currentMaxId + i + 1;

    // Generate unique name
    let firstName, lastName, fullName;
    let nameAttempts = 0;
    do {
      firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      fullName = `${firstName} ${lastName}`;
      nameAttempts++;
      // Add initial if name already exists
      if (
        ALL_PLAYERS_DATA.some((p) => p.name === fullName) &&
        nameAttempts < 5
      ) {
        fullName = `${firstName} ${lastName.charAt(0)}.`;
      }
    } while (
      ALL_PLAYERS_DATA.some((p) => p.name === fullName) &&
      nameAttempts < 10
    );

    if (nameAttempts >= 10) {
      logWarning("Could not generate a unique name, skipping one prospect.");
      continue; // Skip if unique name generation fails after multiple tries
    }

    // Basic attributes
    const age =
      NEW_PLAYER_MIN_AGE + Math.floor(Math.random() * NEW_PLAYER_AGE_RANGE);
    const role = ROLES[Math.floor(Math.random() * ROLES.length)];
    const attitude = ATTITUDES[Math.floor(Math.random() * ATTITUDES.length)];

    // Potential and initial skills
    // Base potential slightly influenced by facility level
    const basePotential = 65 + gameState.facilityLevel * 3;
    const potential = Math.min(
      95,
      basePotential + Math.floor(Math.random() * 15)
    ); // Capped at 95

    // Initial skills are lower than potential
    const skillGap = 15 + Math.floor(Math.random() * 20); // How far below potential they start
    let batting = Math.max(
      10,
      potential - skillGap - Math.floor(Math.random() * 10)
    );
    let bowling = Math.max(
      5,
      potential - skillGap - Math.floor(Math.random() * 10)
    );
    let fielding = Math.max(40, potential - skillGap); // Fielding starts relatively higher

    // Adjust skills based on role
    if (role.includes("Bat") || role.includes("Wk")) {
      // Batsmen/WKs have minimal bowling
      bowling = 10 + Math.floor(Math.random() * 15);
      batting = Math.max(batting, 40); // Ensure batsmen start with decent batting
    } else if (role.includes("Bowl") || role.includes("Spin")) {
      // Bowlers have minimal batting
      batting = 15 + Math.floor(Math.random() * 20);
      bowling = Math.max(bowling, 40); // Ensure bowlers start with decent bowling
    } else {
      // All-rounders have slightly boosted secondary skill
      batting += 10;
      bowling += 10;
    }
    // Cap initial skills slightly below potential
    batting = Math.min(batting, potential - 5);
    bowling = Math.min(bowling, potential - 5);
    fielding = Math.min(fielding, potential - 5);

    // Physical attributes
    const heightInches = 66 + Math.floor(Math.random() * 13); // Range: 5'6" to 6'6"
    const weightLbs = 140 + Math.floor(Math.random() * 40); // Range: 140lbs to 179lbs
    const fitness = 75 + Math.floor(Math.random() * 15); // Initial fitness

    const newPlayer = {
      id: newId,
      name: fullName,
      role: role,
      batting: batting,
      bowling: bowling,
      fielding: fielding,
      potential: potential,
      status: "domestic",
      heightInches: heightInches,
      weightLbs: weightLbs,
      fitness: fitness,
      age: age,
      attitude: attitude,
      // Bowling speed added only if Fast Bowler
      ...(role === "Fast Bowler" && {
        bowlingSpeed: `${125 + Math.floor(Math.random() * 16)}kph`,
      }),
    };

    ALL_PLAYERS_DATA.push(newPlayer);
    logSuccess(
      `New Prospect: ${newPlayer.name} (${newPlayer.role}, Age: ${newPlayer.age}, Pot: ${newPlayer.potential}) added.`
    );
  }
}

/**
 * Checks for random attitude events for players with 'Volatile' attitude.
 * Chance increases if the player is not in the national squad.
 */
function checkAttitudeEvents() {
  ALL_PLAYERS_DATA.forEach((p) => {
    if (p.status !== "RetiredPundit" && p.attitude === "Volatile") {
      let chance = VOLATILE_ATTITUDE_CHANCE; // Base chance
      // Increase chance if not selected for national team
      if (!gameState.nationalSquadIDs.includes(p.id)) {
        chance = 0.3; // Higher chance if feeling left out
      }

      if (Math.random() < chance) {
        // Select a random volatile event message
        const messages = [
          `${p.name} publicly complained about selection!`,
          `${p.name} questioned the team management decisions!`,
          `${p.name} had a training ground argument!`,
          `${p.name} reportedly caused minor damage in the dressing room!`,
          `${p.name} criticised teammates in a media interview!`,
        ];
        const randomMessage =
          messages[Math.floor(Math.random() * messages.length)];
        logAttitude(`ATTITUDE ALERT: ${randomMessage}`);
        // Future enhancement: Could add consequences like fines, temporary stat drops, etc.
      }
    }
  });
}

/**
 * Simulates a random pundit comment based on the result of the last event.
 * Selects a random pundit from the retired list.
 */
function simulatePunditry(lastEventResult) {
  const POSITIVE_PUNDIT_GIF = "pundit_positive.gif";
  const NEGATIVE_PUNDIT_GIF = "pundit_negative.gif";
  const DEFAULT_PUNDIT_IMAGE = "default_pundit.gif";
  if (!gameState.retiredPundits || gameState.retiredPundits.length === 0) {
    return; // No pundits available
  }

  // Select a random pundit
  const pundit =
    gameState.retiredPundits[
      Math.floor(Math.random() * gameState.retiredPundits.length)
    ];

  // Define potential comments
  const criticalComments = [
    "Serious questions need to be asked about the selection policy.",
    "Too many players looked unfit out there.",
    "Where is the planning? Tactics seemed non-existent.",
    "Some baffling decisions made by the captain/management.",
    "It's time to inject some fresh blood into this team.",
    "Frankly, that was a disappointing performance.",
    "Not good enough at this level, simple as that.",
    "The basics were missing today. Need to go back to the drawing board.",
  ];
  const positiveComments = [
    "Some encouraging signs, especially from the youngsters.",
    "You can see the board is working hard behind the scenes.",
    "There's promising talent coming through the ranks.",
    "A good result overall, builds confidence.",
    "They are building a strong unit, need to be patient.",
    "Important to back the players during this phase.",
    "Solid performance, executed the plans well.",
    "Clinical display, dominated the opposition.",
  ];

  // Determine if Pakistan won, lost, or drew based on the result string
  const pakWon =
    lastEventResult &&
    (lastEventResult.includes("PAK wins") || lastEventResult.includes("WON"));
  const pakLost =
    lastEventResult &&
    ((lastEventResult.includes("wins") &&
      !lastEventResult.includes("PAK wins")) ||
      lastEventResult.includes("Lost"));

  // Base chance of being critical (higher if lost, lower if won)
  let baseCriticalChance = 0.3;
  if (pakLost) {
    baseCriticalChance = 0.7;
  } else if (pakWon) {
    baseCriticalChance = 0.1;
  }

  // Adjust chance based on pundit type
  if (pundit.type === "Critical" || pundit.type === "Outspoken") {
    baseCriticalChance += 0.2;
  } else if (pundit.type === "Supportive") {
    baseCriticalChance -= 0.2;
  }
  baseCriticalChance = Math.max(0.05, Math.min(0.95, baseCriticalChance)); // Clamp chance between 5% and 95%

  let comment = "";
  let imageToShow = DEFAULT_PUNDIT_IMAGE;

  // Choose comment AND the appropriate image based on calculated chance
  if (Math.random() < baseCriticalChance) {
    comment =
      criticalComments[Math.floor(Math.random() * criticalComments.length)];
    imageToShow = NEGATIVE_PUNDIT_GIF; // Use the negative GIF
  } else {
    comment =
      positiveComments[Math.floor(Math.random() * positiveComments.length)];
    imageToShow = POSITIVE_PUNDIT_GIF; // Use the positive GIF
  }

  // Add a random source for flavour
  const sources = [
    "on Geo",
    "on ARY",
    "on A Sports",
    "on Ten Sports",
    "on PTV",
    "on Samaa",
    "on X / Twitter",
    "on his YouTube channel",
    "on Instagram",
    "on IG Live",
    "speaking to ESPNcricinfo",
    "in his newspaper column",
    "on a podcast",
  ];
  const source = sources[Math.floor(Math.random() * sources.length)];

  // Log the pundit comment using the specific logger
  logPundit(
    `(${pundit.name} <span class="pundit-source">${source}</span>): "${comment}"`,
    imageToShow // Pass the image filename
  );
}

// --- Team Strength Calculation (Role-aware) ---
/**
 * Calculates the estimated batting, bowling, fielding, and overall strength
 * of a team based on the provided player IDs and role weighting.
 * Considers top N players for each discipline.
 * @param {number[]} playerIds - Array of player IDs in the squad.
 * @returns {object} Object containing batting, bowling, fielding, and overall strengths.
 */
function getTeamStrength(playerIds) {
  const BATTING_PLAYERS_CONSIDERED = 7; // Top 7 batsmen contribute to batting strength
  const BOWLING_PLAYERS_CONSIDERED = 5; // Top 5 bowlers contribute to bowling strength
  const FIELDING_PLAYERS_CONSIDERED = 11; // All 11 fielders contribute

  const squadPlayers = playerIds
    .map((id) => getPlayerById(id))
    .filter((p) => p && p.status !== "RetiredPundit"); // Get valid players

  if (!squadPlayers || squadPlayers.length === 0) {
    return { batting: 0, bowling: 0, fielding: 0, overall: 0 }; // Return zero strength if no players
  }

  let avgBatting = 0,
    avgBowling = 0,
    avgFielding = 0;

  // Calculate Batting Strength (top N batsmen)
  if (squadPlayers.length > 0) {
    const topBatsmen = [...squadPlayers]
      .sort((a, b) => (b.batting || 0) - (a.batting || 0)) // Sort by batting skill
      .slice(0, BATTING_PLAYERS_CONSIDERED); // Take the top N
    if (topBatsmen.length > 0) {
      avgBatting =
        topBatsmen.reduce((sum, p) => sum + (p.batting || 0), 0) /
        topBatsmen.length;
    }
  }

  // Calculate Bowling Strength (top N bowlers)
  if (squadPlayers.length > 0) {
    const topBowlers = [...squadPlayers]
      .sort((a, b) => (b.bowling || 0) - (a.bowling || 0)) // Sort by bowling skill
      .slice(0, BOWLING_PLAYERS_CONSIDERED); // Take the top N
    if (topBowlers.length > 0) {
      avgBowling =
        topBowlers.reduce((sum, p) => sum + (p.bowling || 0), 0) /
        topBowlers.length;
    }
  }

  // Calculate Fielding Strength (top N fielders - usually all 11)
  if (squadPlayers.length > 0) {
    const topFielders = [...squadPlayers]
      .sort((a, b) => (b.fielding || 0) - (a.fielding || 0)) // Sort by fielding skill
      .slice(0, FIELDING_PLAYERS_CONSIDERED); // Take the top N (usually 11)
    if (topFielders.length > 0) {
      avgFielding =
        topFielders.reduce((sum, p) => sum + (p.fielding || 0), 0) /
        topFielders.length;
    }
  }

  // Calculate Overall Strength (weighted average)
  // Weights can be adjusted based on desired importance of each discipline
  const overallStrength =
    avgBatting * 0.4 + avgBowling * 0.4 + avgFielding * 0.2;

  return {
    batting: Math.round(avgBatting),
    bowling: Math.round(avgBowling),
    fielding: Math.round(avgFielding),
    overall: Math.round(overallStrength),
  };
}

// --- Match Simulation Core ---

/**
 * Simulates a single cricket match between Pakistan and an opponent.
 * Determines the winner and generates a detailed scorecard.
 *
 * @param {object} pkTeamStrength - Pakistan's calculated team strength {batting, bowling, fielding, overall}.
 * @param {number} opponentStrengthRating - Opponent's overall strength rating.
 * @param {string} format - Match format ('Test', 'ODI', 'T20').
 * @param {string} pitchType - Home pitch preparation ('balanced', 'batting', 'bowling'). Only applies if location='Home'.
 * @param {string} rollerChoice - Home roller choice ('standard', 'heavy', 'light'). Only applies if location='Home'.
 * @param {string} location - Location ('Home', 'Away', 'Neutral').
 * @returns {object} An object containing simplified scores (pakScore, oppScore), a result string ('Pakistan Win', 'Opponent Win', 'Draw'), and a detailed scorecard object.
 */
function simulateMatch(
  pkTeamStrength,
  opponentStrengthRating,
  format,
  pitchType,
  rollerChoice,
  location,
  matchIndex = 0,
  opponentName = "Opponent"
) {
  console.log(
    `Simulating ${format} match vs ${opponentName} (${opponentStrengthRating}) at ${location} on ${pitchType} pitch (Roller: ${rollerChoice})`
  );

  // Get the actual players selected for Pakistan's team
  const selectedPlayers = gameState.nationalSquadIDs
    .map((id) => getPlayerById(id))
    .filter((p) => p && p.status !== "RetiredPundit");

  // Basic validation: Need at least 11 players
  if (selectedPlayers.length < 11) {
    logWarning(
      "Match simulation requires at least 11 players selected in the squad."
    );
    return {
      pakScore: 0,
      oppScore: 0,
      result: "Forfeit (Insufficient Players)",
      scorecard: createEmptyScorecard(
        format,
        location,
        pitchType,
        opponentStrengthRating,
        "Forfeit (Insufficient Players)",
        matchIndex
      ),
    };
  }

  // Calculate match environment factors affecting the simulation
  const environment = {
    format: format,
    location: location,
    pitchType: location === "Home" ? pitchType : "balanced", // Pitch prep only matters at home
    rollerChoice: location === "Home" ? rollerChoice : "standard", // Roller choice only matters at home
    homeAdvantageFactor:
      location === "Home" ? 1.1 : location === "Away" ? 0.9 : 1.0, // +/- 10% advantage/disadvantage
    pitchFactors: calculatePitchFactors(
      location === "Home" ? pitchType : "balanced",
      location === "Home" ? rollerChoice : "standard"
    ), // Get batting/bowling multipliers
    opponentStrength: opponentStrengthRating,
    pakistanStrength: pkTeamStrength, // Pass Pakistan's strength breakdown
    opponent: opponentName, // Pass the opponent name
  };

  // Create the initial scorecard structure
  const scorecard = createEmptyScorecard(
    format,
    location,
    environment.pitchType,
    opponentStrengthRating,
    "Pending",
    matchIndex
  );

  // Branch simulation based on format
  if (format === "Test") {
    return simulateTestMatch(selectedPlayers, environment, scorecard);
  } else {
    const result = simulateLimitedOversMatch(selectedPlayers, environment, scorecard);
    
    // For limited overs formats (ODI/T20), ensure we never return a "Draw" result
    // If the original result was somehow a "Draw" (which shouldn't happen in limited overs), 
    // convert it to a win for one of the teams based on a tie-breaker
    if (result.result === "Draw") {
      // Determine a winner for the tie
      const tieWinner = Math.random() < 0.5 ? "Pakistan" : "Opponent";
      result.result = `${tieWinner} Win`;
      
      // Update the scorecard with the tie-breaker result
      result.scorecard.result = `Match Tied (${tieWinner} wins tie-breaker)`;
      result.scorecard.winner = tieWinner === "Opponent" ? opponentName : tieWinner;
    }
    
    return result;
  }
}

/**
 * Calculates batting and bowling multipliers based on pitch and roller.
 */
function calculatePitchFactors(pitch, roller) {
  let battingFactor = 1.0;
  let bowlingFactor = 1.0;

  switch (pitch) {
    case "batting": // Flat pitch
      battingFactor = 1.2; // 20% boost to batting
      bowlingFactor = 0.85; // 15% penalty to bowling
      break;
    case "bowling": // Green/Dusty pitch
      battingFactor = 0.85; // 15% penalty to batting
      bowlingFactor = 1.2; // 20% boost to bowling
      break;
    // case "balanced": // Default factors are 1.0
  }

  // Roller effects modify the pitch factors
  if (roller === "heavy") {
    battingFactor *= 1.05; // Heavy roller slightly flattens further
    bowlingFactor *= 0.98; // Slightly harder for bowlers
  } else if (roller === "light") {
    battingFactor *= 0.98; // Light roller might leave slightly more in it
    bowlingFactor *= 1.05; // Slightly helps bowlers
  }

  return { batting: battingFactor, bowling: bowlingFactor };
}

/**
 * Creates the basic structure for a scorecard.
 * @param {string} format Match format
 * @param {string} location Match location
 * @param {string} pitchType Type of pitch
 * @param {number} oppStrength Opponent strength
 * @param {string} result Default result
 * @param {number} matchIndex Optional index to space matches apart
 */
function createEmptyScorecard(
  format,
  location,
  pitchType,
  oppStrength,
  result = "Pending",
  matchIndex = 0
) {
  // Add a significant gap between events (10 days) to prevent overlapping series
  // For realistic scheduling, each event/series should be separated by at least a week
  const eventSpacing = 10; // Days between different series/events

  // Calculate a proper date that spaces events and matches over time
  const baseMonth = Math.min(
    11,
    Math.floor((gameState.currentEventIndex * eventSpacing) / 30)
  );
  const baseDay = 1 + ((gameState.currentEventIndex * eventSpacing) % 30);

  // Add days based on match index within the event (typically 2-4 days between matches)
  const matchDay = Math.min(28, baseDay + matchIndex * 3);

  // If matchDay overflows to next month, adjust
  let finalMonth = baseMonth;
  let finalDay = matchDay;

  // Handle month overflow properly
  if (matchDay > 28) {
    const totalDays = baseMonth * 30 + matchDay;
    finalMonth = Math.min(11, Math.floor(totalDays / 30));
    finalDay = totalDays % 30;
    if (finalDay === 0) finalDay = 30; // Fix for end of month
  }

  return {
    format: format,
    location: location,
    pitchType: pitchType,
    opponentStrength: oppStrength,
    date: new Date(
      gameState.year,
      finalMonth, // Month (0-11)
      finalDay // Day (1-30)
    ),
    result: result,
    winner: null, // To be determined
    // Innings data will be added by the simulation functions
  };
}

/**
 * Simulates a Test Match, including multiple innings and potential follow-on.
 */
function simulateTestMatch(selectedPlayers, environment, scorecard) {
  const testParams = {
    oversPerDay: 90,
    maxWickets: 10,
    followOnThreshold: 200, // Minimum lead required to enforce follow-on
    drawProbabilityFactor: TEST_DRAW_CHANCE, // Base chance of draw factor
    maxTestOvers: 150, // Realistic maximum Test overs per innings (replacing Infinity)
  };

  scorecard.pakInnings = [];
  scorecard.oppInnings = [];

  // --- Innings 1 ---
  logInfo("Simulating 1st Innings (Pakistan Batting)...");
  const pak1stInnings = simulateTeamBatting(
    selectedPlayers,
    environment,
    "Test-1st",
    testParams.maxTestOvers, // Use realistic maximum instead of Infinity
    testParams.maxWickets
  );
  scorecard.pakInnings.push(pak1stInnings);
  logInfo(
    `Pakistan 1st Innings: ${pak1stInnings.totalRuns}/${pak1stInnings.wicketsLost} (${pak1stInnings.oversPlayed} ov)`
  );

  logInfo(`Simulating 1st Innings (${environment.opponent} Batting)...`);
  const opp1stInnings = simulateOpponentBatting(
    selectedPlayers,
    environment,
    "Test-1st",
    testParams.maxTestOvers, // Use realistic maximum instead of Infinity
    testParams.maxWickets
  );
  scorecard.oppInnings.push(opp1stInnings);
  logInfo(
    `${environment.opponent} 1st Innings: ${opp1stInnings.totalRuns}/${opp1stInnings.wicketsLost} (${opp1stInnings.oversPlayed} ov)`
  );

  // --- Innings 2 ---
  const firstInningsLead = pak1stInnings.totalRuns - opp1stInnings.totalRuns;
  const canEnforceFollowOn = firstInningsLead >= testParams.followOnThreshold;
  const enforceFollowOn = canEnforceFollowOn && Math.random() < 0.8; // 80% chance to enforce if possible

  let pakTotalRuns = pak1stInnings.totalRuns;
  let oppTotalRuns = opp1stInnings.totalRuns;

  if (enforceFollowOn) {
    logInfo("Pakistan enforces the follow-on.");
    logInfo(
      `Simulating 2nd Innings (${environment.opponent} Batting - Follow On)...`
    );
    const opp2ndInningsFollowOn = simulateOpponentBatting(
      selectedPlayers,
      environment,
      "Test-2nd-FollowOn",
      testParams.maxTestOvers, // Use realistic maximum instead of Infinity
      testParams.maxWickets,
      pak1stInnings.totalRuns
    );
    scorecard.oppInnings.push(opp2ndInningsFollowOn);
    oppTotalRuns += opp2ndInningsFollowOn.totalRuns;
    logInfo(
      `${environment.opponent} 2nd Innings (f/o): ${opp2ndInningsFollowOn.totalRuns}/${opp2ndInningsFollowOn.wicketsLost} (${opp2ndInningsFollowOn.oversPlayed} ov)`
    );

    if (oppTotalRuns < pakTotalRuns) {
      // Pakistan wins by an innings
      const winMargin = pakTotalRuns - oppTotalRuns;
      scorecard.result = `Pakistan Win by an innings and ${winMargin} runs`;
      scorecard.winner = "Pakistan";
      logWin(scorecard.result);
    } else {
      // Opponent sets a target for Pakistan's 4th innings chase
      const target = oppTotalRuns - pakTotalRuns + 1;
      logInfo(`Pakistan need ${target} runs to win.`);
      logInfo(
        "Simulating 2nd Innings (Pakistan Batting - 4th Innings Chase)..."
      );
      const pak2ndInningsChase = simulateTeamBatting(
        selectedPlayers,
        environment,
        "Test-4th",
        testParams.maxTestOvers, // Use realistic maximum instead of Infinity
        testParams.maxWickets,
        target
      );
      scorecard.pakInnings.push(pak2ndInningsChase);
      pakTotalRuns += pak2ndInningsChase.totalRuns;
      logInfo(
        `Pakistan 2nd Innings: ${pak2ndInningsChase.totalRuns}/${pak2ndInningsChase.wicketsLost} (${pak2ndInningsChase.oversPlayed} ov)`
      );

      if (pak2ndInningsChase.totalRuns >= target) {
        const wicketsLeft =
          testParams.maxWickets - pak2ndInningsChase.wicketsLost;
        scorecard.result = `Pakistan Win by ${wicketsLeft} wickets`;
        scorecard.winner = "Pakistan";
        logWin(scorecard.result);
      } else {
        // Check for Draw (ran out of time/overs conceptually)
        const drawChance =
          testParams.drawProbabilityFactor *
          (pak2ndInningsChase.oversPlayed / 120); // Higher chance if batted long
        if (Math.random() < drawChance) {
          scorecard.result = "Match Drawn";
          scorecard.winner = "Draw";
          logDraw(scorecard.result);
        } else {
          const lossMargin = target - pak2ndInningsChase.totalRuns - 1;
          scorecard.result = `${environment.opponent} Win by ${lossMargin} runs`;
          scorecard.winner = "Opponent";
          logLoss(scorecard.result);
        }
      }
    }
  } else {
    // Pakistan bats 2nd innings normally
    logInfo("Simulating 2nd Innings (Pakistan Batting)...");
    const pak2ndInnings = simulateTeamBatting(
      selectedPlayers,
      environment,
      "Test-2nd",
      testParams.maxTestOvers, // Use realistic maximum instead of Infinity
      testParams.maxWickets
    );
    scorecard.pakInnings.push(pak2ndInnings);
    pakTotalRuns += pak2ndInnings.totalRuns;
    logInfo(
      `Pakistan 2nd Innings: ${pak2ndInnings.totalRuns}/${pak2ndInnings.wicketsLost} (${pak2ndInnings.oversPlayed} ov)`
    );

    // Opponent needs to chase in the 4th innings
    const target = pakTotalRuns - oppTotalRuns + 1;
    if (target <= 0) {
      // Pakistan didn't set a target (or negative) - implies Draw or Loss already
      scorecard.result = "Match Drawn"; // Or potentially loss if Opp lead was huge, but draw is simpler
      scorecard.winner = "Draw";
      logDraw(scorecard.result + " (Target too low)");
    } else {
      logInfo(`${environment.opponent} needs ${target} runs to win.`);
      logInfo(
        "Simulating 2nd Innings (Opponent Batting - 4th Innings Chase)..."
      );

      logInfo(
        `Simulating 2nd Innings (${environment.opponent} Batting - 4th Innings Chase)...`
      );
      const opp2ndInningsChase = simulateOpponentBatting(
        selectedPlayers,
        environment,
        "Test-4th",
        testParams.maxTestOvers, // Use realistic maximum instead of Infinity
        testParams.maxWickets,
        target
      );
      scorecard.oppInnings.push(opp2ndInningsChase);
      oppTotalRuns += opp2ndInningsChase.totalRuns;
      logInfo(
        `${environment.opponent} 2nd Innings: ${opp2ndInningsChase.totalRuns}/${opp2ndInningsChase.wicketsLost} (${opp2ndInningsChase.oversPlayed} ov)`
      );

      if (opp2ndInningsChase.totalRuns >= target) {
        const wicketsLeft =
          testParams.maxWickets - opp2ndInningsChase.wicketsLost;
        scorecard.result = `${environment.opponent} Win by ${wicketsLeft} wickets`;
        scorecard.winner = "Opponent";
        logLoss(scorecard.result);
      } else {
        // Check for Draw
        const drawChance =
          testParams.drawProbabilityFactor *
          (opp2ndInningsChase.oversPlayed / 120);
        if (Math.random() < drawChance) {
          scorecard.result = "Match Drawn";
          scorecard.winner = "Draw";
          logDraw(scorecard.result);
        } else {
          const winMargin = target - opp2ndInningsChase.totalRuns - 1;
          scorecard.result = `${environment.opponent} Win by ${winMargin} runs`;
          scorecard.winner = "Opponent";
          logWin(scorecard.result);
        }
      }
    }
  }

  // --- Final Result Packaging ---
  let finalResultString;
  if (scorecard.winner === "Pakistan") finalResultString = "Pakistan Win";
  else if (scorecard.winner === "Opponent")
    finalResultString = `${environment.opponent} Win`;
  else finalResultString = "Draw";

  return {
    pakScore: scorecard.pakInnings.reduce((sum, inn) => sum + inn.totalRuns, 0), // Sum runs from all Pak innings
    oppScore: scorecard.oppInnings.reduce((sum, inn) => sum + inn.totalRuns, 0), // Sum runs from all Opp innings
    result: finalResultString,
    scorecard: scorecard,
  };
}

/**
 * Simulates a Limited Overs Match (ODI or T20).
 */
function simulateLimitedOversMatch(selectedPlayers, environment, scorecard) {
  const formatParams = {
    ODI: { overs: 50, maxWickets: 10 },
    T20: { overs: 20, maxWickets: 10 },
  };
  const params = formatParams[environment.format];

  // Simulate Coin Toss (50/50 chance)
  const pakBatsFirst = Math.random() < 0.5;
  logInfo(
    `Coin toss: ${
      pakBatsFirst ? "Pakistan" : environment.opponent
    } chooses to bat first.`
  );

  let firstInnings, secondInnings;
  let firstInningsTeam, secondInningsTeam;

  if (pakBatsFirst) {
    // --- Pakistan Bats First ---
    firstInningsTeam = "Pakistan";
    secondInningsTeam = environment.opponent;
    logInfo(`Simulating 1st Innings (${firstInningsTeam} Batting)...`);
    firstInnings = simulateTeamBatting(
      selectedPlayers,
      environment,
      `${environment.format}-1st`,
      params.overs,
      params.maxWickets
    );
    scorecard.pakInnings = firstInnings; // Store Pak's innings data
    logInfo(
      `${firstInningsTeam} 1st Innings: ${firstInnings.totalRuns}/${firstInnings.wicketsLost} (${firstInnings.oversPlayed} ov)`
    );

    // --- Opponent Chases ---
    const target = firstInnings.totalRuns + 1;
    logInfo(
      `Simulating 2nd Innings (${secondInningsTeam} Batting, Target: ${target})...`
    );
    secondInnings = simulateOpponentBatting(
      selectedPlayers,
      environment,
      `${environment.format}-2nd`,
      params.overs,
      params.maxWickets,
      target
    );
    scorecard.oppInnings = secondInnings; // Store Opp's innings data
    logInfo(
      `${secondInningsTeam} 2nd Innings: ${secondInnings.totalRuns}/${secondInnings.wicketsLost} (${secondInnings.oversPlayed} ov)`
    );
  } else {
    // --- Opponent Bats First ---
    firstInningsTeam = environment.opponent;
    secondInningsTeam = "Pakistan";
    logInfo(`Simulating 1st Innings (${firstInningsTeam} Batting)...`);
    firstInnings = simulateOpponentBatting(
      selectedPlayers,
      environment,
      `${environment.format}-1st`,
      params.overs,
      params.maxWickets
    );
    scorecard.oppInnings = firstInnings; // Store Opp's innings data
    logInfo(
      `${firstInningsTeam} 1st Innings: ${firstInnings.totalRuns}/${firstInnings.wicketsLost} (${firstInnings.oversPlayed} ov)`
    );

    // --- Pakistan Chases ---
    const target = firstInnings.totalRuns + 1;
    logInfo(
      `Simulating 2nd Innings (${secondInningsTeam} Batting, Target: ${target})...`
    );
    secondInnings = simulateTeamBatting(
      selectedPlayers,
      environment,
      `${environment.format}-2nd`,
      params.overs,
      params.maxWickets,
      target
    );
    scorecard.pakInnings = secondInnings; // Store Pak's innings data
    logInfo(
      `${secondInningsTeam} 2nd Innings: ${secondInnings.totalRuns}/${secondInnings.wicketsLost} (${secondInnings.oversPlayed} ov)`
    );
  }

  // --- Determine Result ---
  let finalResultString = "";
  if (secondInnings.totalRuns >= firstInnings.totalRuns + 1) {
    // Team batting second wins
    const wicketsLeft = params.maxWickets - secondInnings.wicketsLost;
    scorecard.result = `${
      secondInningsTeam === "Opponent"
        ? environment.opponent
        : secondInningsTeam
    } Win by ${wicketsLeft} wickets`;
    scorecard.winner = secondInningsTeam;
    finalResultString = `${
      secondInningsTeam === "Opponent"
        ? environment.opponent
        : secondInningsTeam
    } Win`;
    if (secondInningsTeam === "Pakistan") logWin(scorecard.result);
    else logLoss(scorecard.result);
  } else if (secondInnings.totalRuns < firstInnings.totalRuns) {
    // Team batting first wins
    const runsMargin = firstInnings.totalRuns - secondInnings.totalRuns;
    scorecard.result = `${
      firstInningsTeam === "Opponent" ? environment.opponent : firstInningsTeam
    } Win by ${runsMargin} runs`;
    scorecard.winner = firstInningsTeam;
    finalResultString = `${
      firstInningsTeam === "Opponent" ? environment.opponent : firstInningsTeam
    } Win`;
    if (firstInningsTeam === "Pakistan") logWin(scorecard.result);
    else logLoss(scorecard.result);
  } else {
    // Match Tied
    // Simple tie-breaker: 50/50 chance for now
    const tieWinner = Math.random() < 0.5 ? "Pakistan" : environment.opponent;
    scorecard.result = `Match Tied (${tieWinner} wins tie-breaker)`; // Simplified tie result
    scorecard.winner = tieWinner;
    finalResultString = `${tieWinner} Win`; // Report winner based on tie-breaker
    logDraw(`Match Tied! ${tieWinner} awarded the win.`);
  }

  // --- Final Result Packaging ---
  // Ensure scores are assigned correctly regardless of who batted first
  const pakFinalScore = pakBatsFirst
    ? firstInnings.totalRuns
    : secondInnings.totalRuns;
  const oppFinalScore = pakBatsFirst
    ? secondInnings.totalRuns
    : firstInnings.totalRuns;

  return {
    pakScore: pakFinalScore,
    oppScore: oppFinalScore,
    result: finalResultString,
    scorecard: scorecard,
  };
}

/**
 * Simulates a single batting innings for Pakistan.
 * @param {object[]} players - Array of selected player objects.
 * @param {object} environment - Match environment details.
 * @param {string} inningsType - Identifier (e.g., "ODI-1st", "Test-4th").
 * @param {number} maxOvers - Maximum overs for the innings (Infinity for Tests).
 * @param {number} maxWickets - Maximum wickets before innings ends.
 * @param {number|null} target - The target score if chasing, otherwise null.
 * @returns {object} Innings details (totalRuns, wicketsLost, oversPlayed, performances, extras).
 */
function simulateTeamBatting(
  players,
  environment,
  inningsType,
  maxOvers,
  maxWickets,
  target = null
) {
  // Sort players by batting skill to determine a plausible batting order
  const battingOrder = [...players].sort(
    (a, b) => (b.batting || 0) - (a.batting || 0)
  );
  const teamBattingStrength = environment.pakistanStrength.batting; // Use pre-calculated strength
  const oppBowlingStrength = environment.opponentStrength * 0.95; // Estimate opponent bowling

  // --- Calculate Base Run Rate ---
  let baseRunRate = calculateBaseRunRate(environment.format, inningsType);
  // Apply environment factors (pitch, home advantage)
  baseRunRate *=
    environment.homeAdvantageFactor * environment.pitchFactors.batting;
  // Adjust based on relative strength vs opposition bowling
  baseRunRate *= Math.pow(teamBattingStrength / oppBowlingStrength, 0.5); // Less extreme impact than linear

  // --- Innings Progression Logic ---
  let wicketsLost = 0;
  let totalRuns = 0;
  let oversPlayed = 0;
  const ballsPerOver = 6;
  const maxBalls = maxOvers * ballsPerOver; // Removed Infinity check - maxOvers is now always a real number
  let ballsBowled = 0;

  // Determine realistic wickets lost based on format and relative strength
  let expectedWicketsFactor = Math.pow(
    oppBowlingStrength / teamBattingStrength,
    0.6
  ); // How likely are wickets?
  expectedWicketsFactor *= 1 / environment.pitchFactors.bowling; // Bowling pitches make wickets more likely
  let avgWickets = 6; // Base average wickets
  if (environment.format === "T20") avgWickets = 5;
  else if (environment.format === "Test") avgWickets = 8; // More likely to be bowled out in tests
  if (inningsType.includes("4th")) avgWickets = 9; // Pressure in 4th innings

  wicketsLost = Math.min(
    maxWickets,
    Math.round(avgWickets * expectedWicketsFactor * (0.8 + Math.random() * 0.4))
  );

  // --- Calculate Overs Played & Total Runs ---
  if (target && inningsType.includes("2nd")) {
    // Chasing logic
    const requiredRunRate = target / maxOvers;
    const chaseDifficulty = requiredRunRate / baseRunRate;
    const successChance = 0.6 / Math.max(0.5, chaseDifficulty); // Base 60% chance, decreases if RRR is high

    if (
      Math.random() <
      successChance * (teamBattingStrength / oppBowlingStrength)
    ) {
      // Successful chase
      totalRuns = target + Math.floor(Math.random() * 10); // Score slightly more than target
      // Estimate overs needed - less if chase was easy
      const oversToReachTarget = Math.min(
        maxOvers,
        target / (baseRunRate * (1 + Math.random() * 0.2))
      );
      oversPlayed = oversToReachTarget * (0.9 + Math.random() * 0.2); // Add variance
      // Reduce wickets lost for successful chases
      wicketsLost = Math.min(
        wicketsLost,
        Math.max(1, Math.floor(wicketsLost * (0.4 + Math.random() * 0.5)))
      );
    } else {
      // Failed chase
      totalRuns = Math.floor(target * (0.7 + Math.random() * 0.29)); // Fall short
      oversPlayed =
        wicketsLost === maxWickets
          ? maxOvers * (0.8 + Math.random() * 0.2) // Bowled out before full overs
          : maxOvers; // Used up all overs
    }
  } else {
    // Setting a target (1st innings or Test 2nd/3rd)
    if (wicketsLost === maxWickets) {
      // Bowled out - estimate overs based on run rate
      oversPlayed = Math.min(
        maxOvers,
        (totalRuns / baseRunRate) * (0.9 + Math.random() * 0.2)
      );
      // Recalculate runs based on realistic overs if bowled out early
      totalRuns = Math.floor(
        baseRunRate * oversPlayed * (0.9 + Math.random() * 0.3)
      );
    } else {
      // Didn't lose all wickets (or declared in Test)
      oversPlayed = maxOvers; // Assume full overs unless Test declaration logic applies
      totalRuns = Math.floor(
        baseRunRate * oversPlayed * (0.9 + Math.random() * 0.3)
      );

      // Test Declaration Logic (simple version)
      if (
        environment.format === "Test" &&
        !inningsType.includes("1st") &&
        !inningsType.includes("4th")
      ) {
        if (totalRuns > 250 && oversPlayed > 60 && Math.random() < 0.4) {
          // Chance to declare
          oversPlayed *= 0.8 + Math.random() * 0.15; // Declare earlier
          totalRuns = Math.floor(
            baseRunRate * oversPlayed * (0.95 + Math.random() * 0.1)
          );
          wicketsLost = Math.min(
            wicketsLost,
            Math.floor(3 + Math.random() * 5)
          ); // Declare with fewer wickets down
          logInfo("Pakistan has declared the innings.");
        }
      }
    }
  }
  // Ensure overs don't exceed max for format
  oversPlayed = Math.min(maxOvers, Math.round(oversPlayed * 10) / 10);
  totalRuns = Math.max(0, totalRuns); // Ensure runs aren't negative

  // --- Generate Individual Performances ---
  const performances = generateBattingPerformances(
    battingOrder,
    totalRuns,
    wicketsLost,
    oversPlayed,
    environment.format,
    inningsType
  );
  const extras = Math.max(
    5,
    Math.floor(totalRuns * (0.04 + Math.random() * 0.04))
  ); // 4-8% extras

  return {
    totalRuns: totalRuns,
    wicketsLost: wicketsLost,
    oversPlayed: oversPlayed,
    performances: performances,
    extras: extras,
  };
}

/**
 * Simulates a single batting innings for the Opponent team.
 * Calculates runs scored and generates bowling figures for Pakistan's bowlers.
 * @param {object[]} pakBowlers - Array of selected Pakistan player objects (used for bowling figures).
 * @param {object} environment - Match environment details.
 * @param {string} inningsType - Identifier (e.g., "ODI-1st", "Test-4th").
 * @param {number} maxOvers - Maximum overs for the innings (Infinity for Tests).
 * @param {number} maxWickets - Maximum wickets before innings ends.
 * @param {number|null} target - The target score if chasing, otherwise null.
 * @returns {object} Innings details {totalRuns, wicketsLost, oversPlayed, bowling (Pak figures), batting (Opp fictional figures), extras}.
 */
function simulateOpponentBatting(
  pakPlayers,
  environment,
  inningsType,
  maxOvers,
  maxWickets,
  target = null
) {
  // Filter and sort Pakistan's players by bowling skill for this innings
  const pakBowlers = [...pakPlayers]
    .filter((p) => (p.bowling || 0) > 30) // Consider players with some bowling skill
    .sort((a, b) => (b.bowling || 0) - (a.bowling || 0));

  const teamBowlingStrength = environment.pakistanStrength.bowling; // Use pre-calculated strength
  const oppBattingStrength = environment.opponentStrength * 1.0; // Opponent batting strength estimate

  // --- Calculate Base Run Rate (for opponent) ---
  let baseRunRate = calculateBaseRunRate(environment.format, inningsType);
  // Apply environment factors (inverse for opponent: away disadvantage, pitch helps Pak bowlers)
  baseRunRate *=
    (1 / environment.homeAdvantageFactor) *
    (1 / environment.pitchFactors.batting); // Opponent batting affected by pitch
  // Adjust based on relative strength vs Pakistan bowling
  baseRunRate *= Math.pow(oppBattingStrength / teamBowlingStrength, 0.5);

  // --- Innings Progression Logic ---
  let wicketsLost = 0;
  let totalRuns = 0;
  let oversPlayed = 0;
  const ballsPerOver = 6;
  const maxBalls = maxOvers * ballsPerOver; // Use real number instead of Infinity
  let ballsBowled = 0;

  // Determine realistic wickets lost based on format and relative strength
  let expectedWicketsFactor = Math.pow(
    teamBowlingStrength / oppBattingStrength,
    0.6
  ); // How likely Pak takes wickets
  expectedWicketsFactor *= environment.pitchFactors.bowling; // Bowling pitches make wickets more likely
  let avgWickets = 6;
  if (environment.format === "T20") avgWickets = 5;
  else if (environment.format === "Test") avgWickets = 8;
  if (inningsType.includes("4th")) avgWickets = 9;

  wicketsLost = Math.min(
    maxWickets,
    Math.round(avgWickets * expectedWicketsFactor * (0.8 + Math.random() * 0.4))
  );

  // --- Calculate Overs Played & Total Runs ---
  if (target && inningsType.includes("4th")) {
    // Opponent is chasing
    const requiredRunRate = target / maxOvers;
    const chaseDifficulty = requiredRunRate / baseRunRate;
    // Lower base chance for opponent (50% vs 60% for Pakistan)
    const successChance = 0.5 / Math.max(0.5, chaseDifficulty);

    if (
      Math.random() <
      successChance * (oppBattingStrength / teamBowlingStrength)
    ) {
      // Successful chase
      totalRuns = target + Math.floor(Math.random() * 10);
      const oversToReachTarget = Math.min(
        maxOvers,
        target / (baseRunRate * (1 + Math.random() * 0.2))
      );
      oversPlayed = oversToReachTarget * (0.9 + Math.random() * 0.2);
      wicketsLost = Math.min(
        wicketsLost,
        Math.max(1, Math.floor(wicketsLost * (0.4 + Math.random() * 0.5)))
      );
    } else {
      // Failed chase
      totalRuns = Math.floor(target * (0.7 + Math.random() * 0.29));
      oversPlayed =
        wicketsLost === maxWickets
          ? maxOvers * (0.8 + Math.random() * 0.2)
          : maxOvers;
    }
  } else {
    // Setting a first innings score or follow-on 2nd innings
    if (wicketsLost === maxWickets) {
      // Bowled out
      oversPlayed = Math.min(
        maxOvers,
        (totalRuns / baseRunRate) * (0.9 + Math.random() * 0.2)
      );
      totalRuns = Math.floor(
        baseRunRate * oversPlayed * (0.9 + Math.random() * 0.3)
      );
    } else {
      oversPlayed = maxOvers; // Full overs if not bowled out
      totalRuns = Math.floor(
        baseRunRate * oversPlayed * (0.9 + Math.random() * 0.3)
      );

      // Test Declaration Logic for opponent
      if (
        environment.format === "Test" &&
        !inningsType.includes("1st") &&
        !inningsType.includes("4th") &&
        !inningsType.includes("FollowOn")
      ) {
        if (totalRuns > 250 && oversPlayed > 60 && Math.random() < 0.4) {
          oversPlayed *= 0.8 + Math.random() * 0.15;
          totalRuns = Math.floor(
            baseRunRate * oversPlayed * (0.95 + Math.random() * 0.1)
          );
          wicketsLost = Math.min(
            wicketsLost,
            Math.floor(3 + Math.random() * 5)
          );
          logInfo(`${environment.opponent} has declared the innings.`);
        }
      }
    }
  }
  // Ensure overs don't exceed max
  oversPlayed = Math.min(maxOvers, Math.round(oversPlayed * 10) / 10);
  totalRuns = Math.max(0, totalRuns);

  // --- Generate Pakistan Bowling Figures ---
  const bowling = generateBowlingPerformances(
    pakBowlers,
    totalRuns,
    wicketsLost,
    oversPlayed,
    environment.format,
    inningsType,
    environment
  );

  // --- Generate Fictional Opponent Batting Figures ---
  // We can skip detailed opponent batting stats when not needed
  // But create them for scorecards if desired
  const batting = generateOpponentBattingPerformances(
    totalRuns,
    wicketsLost,
    oversPlayed,
    environment.format,
    oppBattingStrength
  );

  // Random extras (4-8% of total runs)
  const extras = Math.max(
    5,
    Math.floor(totalRuns * (0.04 + Math.random() * 0.04))
  );

  return {
    totalRuns: totalRuns,
    wicketsLost: wicketsLost,
    oversPlayed: oversPlayed,
    bowling: bowling,
    batting: batting,
    extras: extras,
  };
}

/**
 * Calculates a base run rate depending on the format and innings type.
 */
function calculateBaseRunRate(format, inningsType) {
  switch (format) {
    case "T20":
      return inningsType.includes("1st") ? 8.0 : 8.5; // Slightly higher chasing
    case "ODI":
      return inningsType.includes("1st") ? 5.5 : 5.8; // Slightly higher chasing
    default: // Test
      if (inningsType.includes("1st")) return 3.2;
      if (inningsType.includes("2nd")) return 3.4; // Often pushing for lead/declaration
      if (inningsType.includes("4th")) return 3.0; // Pressure or playing for draw
      return 3.1; // Fallback (e.g., Test 3rd innings)
  }
}

/**
 * Generates plausible individual batting performances for a team innings.
 * Distributes runs based on batting order, skill, and randomness.
 */
function generateBattingPerformances(
  players,
  totalRuns,
  wickets,
  overs,
  format,
  inningsType
) {
  const performances = [];
  const maxBatsmen = Math.min(players.length, 11); // Max 11 can bat
  let runsToDistribute = Math.max(
    0,
    totalRuns - Math.floor(totalRuns * (0.04 + Math.random() * 0.04))
  ); // Account for 4-8% extras
  let wicketsTaken = wickets;

  // --- Calculate contribution weights ---
  let distributionWeights = [];
  let totalWeight = 0;
  for (let i = 0; i < maxBatsmen; i++) {
    const player = players[i]; // Assumes players array is sorted batting order
    if (!player) continue;

    let weight = 0;
    // Base weight on batting position
    if (i < 2) weight = 0.25; // Openers
    else if (i < 5) weight = 0.18; // Top/Middle order
    else if (i < 7) weight = 0.1; // Middle/Lower order
    else weight = 0.05; // Tailenders

    // Modify weight by batting skill (relative to a baseline of 70)
    weight *= Math.pow((player.batting || 50) / 70, 1.5); // Skill has significant impact

    // Adjust for format (tailenders slightly more important in T20)
    if (format === "T20" && i >= 6) weight *= 1.2;

    distributionWeights.push(weight);
    totalWeight += weight;
  }

  // --- Distribute Runs ---
  for (let i = 0; i < maxBatsmen; i++) {
    const player = players[i];
    if (!player) continue;

    // Calculate share of runs based on normalized weight
    const normalizedWeight = (distributionWeights[i] || 0) / totalWeight;
    let playerRuns = Math.round(
      normalizedWeight * runsToDistribute * (0.8 + Math.random() * 0.4)
    ); // Add randomness

    // Ensure player doesn't take more runs than available
    playerRuns = Math.min(playerRuns, runsToDistribute);

    // Assign runs and update remaining runs
    runsToDistribute -= playerRuns;

    // --- Generate Other Stats ---
    const strikeRate = calculateStrikeRate(playerRuns, format, inningsType);
    const ballsFaced =
      playerRuns === 0
        ? Math.floor(Math.random() * 5) + 1
        : Math.max(1, Math.round((playerRuns * 100) / strikeRate)); // Min 1 ball if runs > 0
    const fours = generateBoundaryCount(playerRuns, "four", format);
    const sixes = generateBoundaryCount(playerRuns, "six", format);

    // Determine dismissal
    let dismissal = "Not Out";
    if (wicketsTaken > 0) {
      dismissal = generateDismissal(playerRuns, i, format);
      wicketsTaken--; // Decrement remaining wickets
    } else if (i >= maxBatsmen - wickets) {
      // If remaining players must be not out (wickets already assigned)
      dismissal = "Not Out";
    }

    performances.push({
      name: player.name,
      runs: playerRuns,
      balls: ballsFaced,
      fours: fours,
      sixes: sixes,
      strikeRate: strikeRate > 0 ? strikeRate.toFixed(1) : "0.0",
      dismissal: dismissal,
    });
  }

  // Add extras if calculated runs didn't match total
  const assignedRuns = performances.reduce((sum, p) => sum + (p.runs || 0), 0);
  const extrasValue = totalRuns - assignedRuns;
  if (extrasValue > 0) {
    performances.push({
      name: "Extras",
      runs: extrasValue,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: "-",
      dismissal: "",
    });
  }

  return performances;
}

/**
 * Generates plausible individual bowling performances for the bowling team.
 * Distributes overs, runs, and wickets based on bowler skill and format.
 */
function generateBowlingPerformances(
  bowlers,
  totalRunsConceded,
  wicketsTaken,
  oversBowled,
  format,
  inningsType,
  environment
) {
  const performances = [];
  // Determine number of bowlers likely used based on format and availability
  const numBowlersToUse = Math.min(
    bowlers.length,
    format === "T20" ? 5 : format === "ODI" ? 6 : 7
  );

  if (numBowlersToUse === 0) return performances; // No bowlers available

  let remainingOvers = oversBowled;
  let remainingWickets = wicketsTaken;
  let remainingRuns = totalRunsConceded;

  // --- Calculate Overs Distribution Weights ---
  let overWeights = [];
  let totalOverWeight = 0;
  for (let i = 0; i < numBowlersToUse; i++) {
    const bowler = bowlers[i]; // Assumes bowlers array is sorted by skill
    let weight = 1.0; // Base weight
    // Give more overs to better bowlers
    weight *= Math.pow((bowler.bowling || 50) / 75, 1.2);
    // Slightly fewer overs for the 5th/6th/7th bowler typically
    if (i >= 4) weight *= 0.7;
    overWeights.push(weight);
    totalOverWeight += weight;
  }

  // --- Assign Overs, Wickets, Runs ---
  for (let i = 0; i < numBowlersToUse; i++) {
    const bowler = bowlers[i];
    if (!bowler) continue;

    // Calculate Overs for this bowler
    const normalizedOverWeight = (overWeights[i] || 0) / totalOverWeight;
    let bowlerOvers =
      normalizedOverWeight * oversBowled * (0.9 + Math.random() * 0.2);

    // Apply format limits
    if (format === "T20") bowlerOvers = Math.min(4, bowlerOvers);
    else if (format === "ODI") bowlerOvers = Math.min(10, bowlerOvers);

    // Ensure not more than remaining overs, round neatly
    bowlerOvers = Math.min(remainingOvers, Math.round(bowlerOvers * 10) / 10);
    remainingOvers -= bowlerOvers;
    bowlerOvers = Math.max(0.1, bowlerOvers); // Min 1 ball

    // Calculate Wickets for this bowler
    let bowlerWickets = 0;
    if (remainingWickets > 0 && oversBowled > 0) {
      // Chance based on relative skill and overs bowled share
      const wicketChanceFactor = Math.pow((bowler.bowling || 50) / 75, 1.5);
      const expectedWicketsShare = (bowlerOvers / oversBowled) * wicketsTaken;
      bowlerWickets = Math.min(
        remainingWickets,
        Math.round(
          expectedWicketsShare *
            wicketChanceFactor *
            (0.7 + Math.random() * 0.6)
        )
      );
      remainingWickets -= bowlerWickets;
    }

    // Calculate Runs Conceded
    let bowlerEconomy;
    // Base economy depends on format
    if (format === "T20")
      bowlerEconomy = 8.0 + (Math.random() * 3 - 1.5); // 6.5 to 9.5
    else if (format === "ODI")
      bowlerEconomy = 5.5 + (Math.random() * 2 - 1.0); // 4.5 to 7.5
    else bowlerEconomy = 3.3 + (Math.random() * 1.4 - 0.7); // 2.6 to 4.7 (Test)

    // Adjust economy: lower for better bowlers, higher for worse
    bowlerEconomy *= Math.pow(75 / (bowler.bowling || 50), 0.8);
    // Adjust economy based on pitch factor for bowling
    bowlerEconomy *= 1 / environment.pitchFactors.bowling; // If pitch helps bowlers, economy goes down

    let runsConceded = Math.round(bowlerOvers * bowlerEconomy);
    // Ensure not more than remaining runs (can happen with low totals)
    runsConceded = Math.min(remainingRuns, Math.max(0, runsConceded)); // Min 0 runs
    remainingRuns -= runsConceded;

    // Calculate Maidens (approximate)
    let maidens = 0;
    if (bowlerOvers > 0 && runsConceded >= 0) {
      // Check for valid overs/runs
      const runsPerBall = runsConceded / (bowlerOvers * 6);
      const maidenChancePerOver =
        format === "Test" ? 0.2 : format === "ODI" ? 0.1 : 0.02;
      if (runsPerBall < 0.5) {
        // More likely if economy is very low
        maidens = Math.min(
          Math.floor(bowlerOvers),
          Math.floor(bowlerOvers * maidenChancePerOver * (1.5 - runsPerBall))
        );
      }
      maidens = Math.max(0, maidens); // Ensure non-negative
    }

    performances.push({
      name: bowler.name,
      overs: bowlerOvers.toFixed(1), // Format to 1 decimal place
      maidens: maidens,
      runs: runsConceded,
      wickets: bowlerWickets,
      economy:
        bowlerOvers > 0 ? (runsConceded / bowlerOvers).toFixed(2) : "0.00",
    });
  }

  // Distribute remaining overs/runs/wickets if calculation didn't perfectly align
  if (remainingOvers > 0.05 && performances.length > 0) {
    // Distribute remaining overs (small amounts)
    performances[0].overs = (
      parseFloat(performances[0].overs) + remainingOvers
    ).toFixed(1);
  }
  if (remainingRuns > 0 && performances.length > 0) {
    // Assign remaining runs to first bowler
    performances[0].runs += remainingRuns;
  }
  while (remainingWickets > 0 && performances.length > 0) {
    // Assign remaining wickets randomly
    const randomIndex = Math.floor(Math.random() * performances.length);
    performances[randomIndex].wickets++;
    remainingWickets--;
  }
  // Recalculate economy for bowlers whose stats changed
  performances.forEach((p) => {
    if (parseFloat(p.overs) > 0) {
      p.economy = (p.runs / parseFloat(p.overs)).toFixed(2);
    }
  });

  return performances;
}

/**
 * Generates fictional batting performances for the opponent team.
 * Used for scorecard completeness, not direct simulation impact.
 */
function generateOpponentBattingPerformances(
  totalRuns,
  wickets,
  overs,
  format,
  oppStrength
) {
  const performances = [];
  const maxBatsmen = 11;

  // Create fictional opponent names
  const oppBattingOrder = [];
  const usedNames = new Set();
  for (let i = 0; i < maxBatsmen; i++) {
    let fName,
      lName,
      fullName,
      attempts = 0;
    do {
      fName =
        OPPONENT_FIRST_NAMES[
          Math.floor(Math.random() * OPPONENT_FIRST_NAMES.length)
        ];
      lName =
        OPPONENT_LAST_NAMES[
          Math.floor(Math.random() * OPPONENT_LAST_NAMES.length)
        ];
      fullName = `${fName} ${lName}`;
      attempts++;
    } while (usedNames.has(fullName) && attempts < 20); // Try to get unique names
    usedNames.add(fullName);
    oppBattingOrder.push(fullName);
  }

  // Distribute runs (similar logic to generateBattingPerformances, but simpler weights)
  let runsToDistribute = Math.max(
    0,
    totalRuns - Math.floor(totalRuns * (0.04 + Math.random() * 0.04))
  );
  let wicketsTaken = wickets;

  // Simple distribution weights based on position
  const weights = [
    0.25, 0.22, 0.18, 0.15, 0.1, 0.05, 0.03, 0.01, 0.005, 0.003, 0.002,
  ];
  const totalWeight = weights.reduce((s, w) => s + w, 0); // Normalize weights

  for (let i = 0; i < maxBatsmen; i++) {
    const normalizedWeight = (weights[i] || 0) / totalWeight;
    let playerRuns = Math.round(
      normalizedWeight * runsToDistribute * (0.8 + Math.random() * 0.4)
    );
    playerRuns = Math.min(playerRuns, runsToDistribute);
    runsToDistribute -= playerRuns;

    const strikeRate = calculateStrikeRate(playerRuns, format, ""); // Use generic strike rate calc
    const ballsFaced =
      playerRuns === 0
        ? Math.floor(Math.random() * 5) + 1
        : Math.max(1, Math.round((playerRuns * 100) / strikeRate));
    const fours = generateBoundaryCount(playerRuns, "four", format);
    const sixes = generateBoundaryCount(playerRuns, "six", format);

    let dismissal = "Not Out";
    if (wicketsTaken > 0) {
      dismissal = generateDismissal(playerRuns, i, format);
      wicketsTaken--;
    } else if (i >= maxBatsmen - wickets) {
      dismissal = "Not Out";
    }

    performances.push({
      name: oppBattingOrder[i],
      runs: playerRuns,
      balls: ballsFaced,
      fours: fours,
      sixes: sixes,
      strikeRate: strikeRate > 0 ? strikeRate.toFixed(1) : "0.0",
      dismissal: dismissal,
    });
  }

  // Add extras
  const assignedRuns = performances.reduce((sum, p) => sum + (p.runs || 0), 0);
  const extrasValue = totalRuns - assignedRuns;
  if (extrasValue > 0) {
    performances.push({
      name: "Extras",
      runs: extrasValue,
      balls: 0,
      fours: 0,
      sixes: 0,
      strikeRate: "-",
      dismissal: "",
    });
  }

  return performances;
}

/**
 * Calculates a plausible strike rate based on runs scored and format.
 */
function calculateStrikeRate(runs, format, inningsType) {
  let baseRate;
  // T20: Higher SR, increases with score
  if (format === "T20") {
    if (runs < 10) baseRate = 80 + Math.random() * 50; // 80-130
    else if (runs < 30) baseRate = 110 + Math.random() * 50; // 110-160
    else baseRate = 130 + Math.random() * 60; // 130-190
  }
  // ODI: Moderate SR, increases with score
  else if (format === "ODI") {
    if (runs < 10) baseRate = 60 + Math.random() * 35; // 60-95
    else if (runs < 50) baseRate = 75 + Math.random() * 35; // 75-110
    else baseRate = 85 + Math.random() * 40; // 85-125
  }
  // Test: Lower SR, depends on innings, less sensitive to score
  else {
    baseRate = 35 + Math.random() * 25; // 35-60 base
    if (inningsType.includes("4th") && runs > 50) {
      // Defensive in 4th innings chase/block
      baseRate *= 0.8;
    } else if (inningsType.includes("2nd") || inningsType.includes("3rd")) {
      baseRate *= 1.1; // Slightly higher in middle innings
    }
  }
  // Apply small random variation
  return baseRate * (0.9 + Math.random() * 0.2);
}

/**
 * Generates a plausible number of boundaries (4s or 6s) based on runs and format.
 */
function generateBoundaryCount(runs, boundaryType, format) {
  if (runs <= 0) return 0;

  let boundaryValue = boundaryType === "four" ? 4 : 6;
  let basePercentage; // % of runs from this boundary type

  if (boundaryType === "four") {
    basePercentage = format === "T20" ? 0.18 : format === "ODI" ? 0.16 : 0.14;
  } else {
    // Sixes
    basePercentage = format === "T20" ? 0.12 : format === "ODI" ? 0.06 : 0.02;
  }

  // Calculate approximate number based on percentage of runs
  const approxCount = Math.floor((runs * basePercentage) / boundaryValue);

  // Add randomness: +/- 1 or 2 usually
  const randomFactor = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
  return Math.max(0, approxCount + randomFactor);
}

/**
 * Generates a plausible mode of dismissal based on runs, position, and format.
 */
function generateDismissal(runs, position, format) {
  const dismissals = [
    "Caught",
    "Bowled",
    "LBW",
    "Run Out",
    "Stumped",
    "Caught & Bowled",
  ];
  // Base weights - Caught is most common
  let weights = [0.55, 0.15, 0.12, 0.08, 0.05, 0.05];

  // Adjust weights based on context
  if (runs < 10) {
    // Low score - Bowled/LBW more likely
    weights = [0.45, 0.25, 0.2, 0.05, 0.03, 0.02];
  } else if (runs > 75) {
    // High score - Caught more likely, maybe Run Out
    weights = [0.65, 0.1, 0.08, 0.1, 0.04, 0.03];
  }
  if (format === "T20" && runs > 20) {
    // T20 high scores - Caught/Run Out more likely
    weights = [0.6, 0.1, 0.08, 0.12, 0.05, 0.05];
  }
  if (position >= 7) {
    // Tailender - Bowled/LBW/Caught more likely
    weights = [0.4, 0.3, 0.2, 0.03, 0.01, 0.06];
  }

  return weightedRandomChoice(dismissals, weights); // Use helper function
}

/**
 * Helper function to select an item based on weights.
 */
function weightedRandomChoice(options, weights) {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const randomThreshold = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (let i = 0; i < options.length; i++) {
    cumulativeWeight += weights[i];
    if (randomThreshold <= cumulativeWeight) {
      return options[i];
    }
  }
  // Fallback in case of floating point issues
  return options[options.length - 1];
}

// --- Schedule Generation & Simulation Flow ---
const MAJOR_NATIONS = [
  "Australia",
  "England",
  "India",
  "South Africa",
  "New Zealand",
]; // Top 5 for frequent tours
const OTHER_FULL_MEMBERS = [
  "West Indies",
  "Sri Lanka",
  "Bangladesh",
  "Afghanistan",
  "Ireland",
  "Zimbabwe",
];

/**
 * Generates the schedule for a given year, including tournaments and bilateral series.
 * Attempts to balance home/away series and opponent variety.
 */
function generateSchedule(targetYear) {
  console.log(`Generating schedule for year ${targetYear}...`);
  const newSchedule = [];
  const allOpponents = [...MAJOR_NATIONS, ...OTHER_FULL_MEMBERS];
  const formats = ["Test", "ODI", "T20"];
  const numBilateralSeries = 4 + Math.floor(Math.random() * 3); // 4-6 bilateral series per year
  let homeSeriesCount = 0;
  let awaySeriesCount = 0;
  let scheduledOpponentsThisYear = new Set(); // Track opponents scheduled this year
  let scheduledTournaments = 0;

  // --- Tournament Scheduling ---
  const tournaments = {
    "ICC Men's Cricket World Cup": {
      freq: 4,
      format: "ODI",
      last:
        gameState.lastMajorTournamentYear["ICC Men's Cricket World Cup"] ||
        2019,
    },
    "ICC Men's T20 World Cup": {
      freq: 2,
      format: "T20",
      last:
        gameState.lastMajorTournamentYear["ICC Men's T20 World Cup"] || 2022,
    },
    "ICC Champions Trophy": {
      freq: 4,
      format: "ODI",
      last: gameState.lastMajorTournamentYear["ICC Champions Trophy"] || 2017,
    },
    "ICC World Test Championship": {
      freq: 2,
      format: "Test",
      last:
        gameState.lastMajorTournamentYear["ICC World Test Championship"] ||
        2023,
    }, // Biennial Final
    "Asia Cup": {
      freq: 2,
      format: "Variable",
      last: gameState.lastMajorTournamentYear["Asia Cup"] || 2023,
    },
  };

  for (const tName in tournaments) {
    const tInfo = tournaments[tName];
    const yearsSince = targetYear - tInfo.last;

    if (yearsSince > 0 && yearsSince % tInfo.freq === 0) {
      let tFormat = tInfo.format;
      if (tName === "Asia Cup") {
        // Alternate format based roughly on upcoming World Cup
        tFormat = targetYear % 4 === 1 || targetYear % 4 === 2 ? "T20" : "ODI";
      }
      // Basic hosting logic (rotate major nations, potential home events)
      let hostNation = MAJOR_NATIONS[targetYear % MAJOR_NATIONS.length];
      let location = "Away"; // Default location
      let isHomeTournament = false;

      // Specific hosting years (example - needs refinement/data)
      if (tName === "ICC Champions Trophy" && targetYear === 2025)
        isHomeTournament = true; // Hypothetical
      if (tName === "Asia Cup" && targetYear === 2026) isHomeTournament = true; // Hypothetical

      if (isHomeTournament) {
        hostNation = "Pakistan";
        location = "Home";
      } else if (hostNation === "Pakistan") {
        // Avoid hosting consecutive non-specific events
        hostNation = MAJOR_NATIONS[(targetYear + 1) % MAJOR_NATIONS.length];
      }

      newSchedule.push({
        type: "Tournament",
        name: tName,
        format: tFormat,
        location: location, // Home/Away relative to Pakistan
        host: hostNation, // Actual host country
        matches: 5, // Placeholder number of matches in a tournament
        reason: null,
      });
      gameState.lastMajorTournamentYear[tName] = targetYear; // Update last scheduled year
      scheduledTournaments++;
      logInfo(
        `Scheduled Tournament: ${tName} (${tFormat}, Host: ${hostNation})`
      );
      break; // Schedule only one major tournament per year typically
    }
  }

  // --- Bilateral Series Scheduling ---
  const potentialOpponents = [...allOpponents]; // Reset list for bilateral
  for (let i = 0; i < numBilateralSeries; i++) {
    if (potentialOpponents.length === 0) break; // Stop if no more opponents available

    // Select opponent randomly, try not to repeat from *this year*
    let opponent;
    let attempts = 0;
    do {
      opponent = potentialOpponents.splice(
        Math.floor(Math.random() * potentialOpponents.length),
        1
      )[0];
      attempts++;
    } while (
      scheduledOpponentsThisYear.has(opponent) &&
      attempts < 10 &&
      potentialOpponents.length > 0
    );

    if (!opponent) continue; // Skip if we couldn't find a suitable opponent

    scheduledOpponentsThisYear.add(opponent); // Add to this year's set

    // Determine Location (try to balance home/away)
    let location;
    if (
      homeSeriesCount <= awaySeriesCount ||
      (Math.random() < 0.5 && homeSeriesCount < 3)
    ) {
      location = "Home";
      homeSeriesCount++;
    } else {
      location = "Away";
      awaySeriesCount++;
    }

    // Determine Format (mix of formats)
    let format = formats[i % formats.length]; // Cycle through formats
    // More ODIs/T20s generally, fewer Tests unless against major nations
    if (MAJOR_NATIONS.includes(opponent) && Math.random() < 0.4) {
      format = "Test";
    } else if (Math.random() < 0.6) {
      format = "ODI";
    } else {
      format = "T20";
    }

    // Determine Number of Matches
    let matches =
      format === "Test"
        ? Math.random() < 0.6
          ? 2
          : 3 // 2 or 3 Tests
        : format === "ODI"
        ? Math.random() < 0.7
          ? 3
          : 5 // 3 or 5 ODIs
        : 3; // 3 T20s

    // Add security refusal possibility for Home series against some nations
    let reason = null;
    if (
      location === "Home" &&
      ["India", "Afghanistan"].includes(opponent) &&
      Math.random() < 0.15
    ) {
      // Small chance they refuse
      location = "Neutral"; // Force neutral venue
      reason = "security";
      logWarning(`Security concern: ${opponent} tour moved to neutral venue.`);
    }

    newSchedule.push({
      type: "Bilateral Series",
      opponent: opponent,
      format: format,
      matches: matches,
      location: location,
      reason: reason,
    });
  }

  // Sort schedule roughly chronologically (simple sort for now)
  newSchedule.sort((a, b) => (a.type === "Tournament" ? -1 : 1)); // Prioritize tournaments slightly

  gameState.schedule = newSchedule;
  gameState.currentEventIndex = 0; // Reset event index for the new year
  logInfo(
    `Generated schedule for ${targetYear} with ${newSchedule.length} events.`
  );
  return newSchedule;
}

/**
 * Advances the game to the next year:
 * - Updates the budget based on annual income/expenses.
 * - Handles player aging and retirements.
 * - Generates new domestic players.
 * - Generates the schedule for the new year.
 * - Resets year-specific state.
 */
function proceedToNextYear(winsThisYear = 0) {
  logMessage(`--- End of Events for ${gameState.year} ---`);

  // 1. Apply end-of-year updates
  updateBudget(winsThisYear); // Pass wins for bonus calculation
  handleRetirementsAndAging();
  generateNewPlayers();
  applyTrainingAndDevelopment(); // Apply training *after* aging/new players

  // 2. Advance year
  gameState.year++;
  logMessage(`Advancing to year ${gameState.year}.`);

  // 3. Generate new schedule & reset index
  generateSchedule(gameState.year); // Creates gameState.schedule
  gameState.currentEventIndex = 0;

  // 4. Reset temporary states
  gameState.currentHomePitchPrep = "balanced";
  gameState.currentRollerChoice = "standard";

  // 5. Full UI Refresh
  renderAllUI();
}

/**
 * Simulates the next event in the schedule. Handles both bilateral series
 * and tournaments, simulates matches, updates history, triggers player
 * development, punditry, attitude checks, and advances the game state.
 */
function simulateNextEvent() {
  // Check if schedule is finished for the year
  if (
    !gameState.schedule ||
    gameState.currentEventIndex >= gameState.schedule.length
  ) {
    logInfo("Schedule for the year completed.");
    // Calculate total wins from matchHistory for the completed year (if needed for budget)
    const winsThisYear = gameState.matchHistory
      ? gameState.matchHistory.filter(
          (m) => m.year === gameState.year && m.result === "Pakistan Win"
        ).length
      : 0;
    proceedToNextYear(winsThisYear);
    return; // Stop execution for this click
  }

  // Check for sufficient players
  if (gameState.nationalSquadIDs.length < 11) {
    logWarning(
      "Cannot simulate: Need at least 11 players selected in the squad."
    );
    return;
  }

  // --- Quarterly Budget Update ---
  // Update budget periodically throughout the year based on event progression
  // This creates a more dynamic financial experience than just year-end updates
  const quarterlyThreshold = Math.floor(gameState.schedule.length / 4);
  if (gameState.currentEventIndex > 0 && gameState.currentEventIndex % quarterlyThreshold === 0) {
    const quarterNum = Math.floor(gameState.currentEventIndex / quarterlyThreshold);
    // Calculate partial stadium income and expenses for the quarter
    const stadiumIncome = calculateStadiumIncome() / 4; // Quarter of annual stadium income
    const facilityMaintenance = calculateFacilityMaintenance() / 4; // Quarter of maintenance costs
    const baseIncome = ANNUAL_BUDGET_INCREASE / 4; // Quarter of annual budget increase
    const baseExpenses = BASE_ANNUAL_EXPENSES / 4; // Quarter of base expenses
    
    // Apply changes to budget
    if (baseIncome > 0) {
      gameState.budget += baseIncome;
      trackTransaction(baseIncome, "Quarterly Budget");
    }
    
    if (stadiumIncome > 0) {
      gameState.budget += stadiumIncome;
      trackTransaction(stadiumIncome, "Quarterly Stadium Revenue");
    }
    
    if (baseExpenses > 0) {
      gameState.budget -= baseExpenses;
      trackTransaction(-baseExpenses, "Quarterly Expenses");
    }
    
    if (facilityMaintenance > 0) {
      gameState.budget -= facilityMaintenance;
      trackTransaction(-facilityMaintenance, "Quarterly Maintenance");
    }
    
    logBudget(`Quarterly Budget Update (Q${quarterNum}): +$${(baseIncome + stadiumIncome).toFixed(1)}M income, -$${(baseExpenses + facilityMaintenance).toFixed(1)}M expenses`);
    updateStatusBarUI(); // Update the UI to show new budget
  }

  // --- UI Feedback: Disable button and show "Simulating..." ---
  if (uiElements.simulateButton) {
    // Safety check
    uiElements.simulateButton.disabled = true;
    uiElements.simulateButton.textContent = "Simulating...";
  }

  const event = gameState.schedule[gameState.currentEventIndex];
  let eventStartMsg = `Simulating Event ${gameState.currentEventIndex + 1}/${
    gameState.schedule.length
  }: ${event.type} - ${event.name || `vs ${event.opponent}`}`;
  let totalWinsInEvent = 0; // Track wins within this event for budget at year end (or immediate bonus?)

  // Adjust pitch/roller if not Home
  let pitchPrep =
    event.location === "Home"
      ? gameState.currentHomePitchPrep || "balanced"
      : "balanced";
  let roller =
    event.location === "Home"
      ? gameState.currentRollerChoice || "standard"
      : "standard";

  // Handle security refusals
  if (event.location === "Neutral" && event.reason === "security") {
    eventStartMsg += ` (at Neutral Venue due to Security Concerns)`;
    logWarning(
      `${event.opponent} refused to tour Pakistan. Series moved to a neutral venue.`
    );
    pitchPrep = "balanced"; // Neutral venues are always balanced
    roller = "standard";
  } else {
    eventStartMsg += ` (${event.location})`;
  }

  logInfo(eventStartMsg);

  // Get team strengths
  const pakStrength = getTeamStrength(gameState.nationalSquadIDs);
  let opponentStrength = 70; // Default
  let opponentName = "Opponent";

  let eventResultSummary = "Pending"; // Summary string for punditry

  // --- Simulate based on Event Type ---
  if (event.type === "Bilateral Series") {
    opponentName = event.opponent;
    opponentStrength = gameState.opponents[opponentName] || 70;
    let pakWins = 0,
      oppWins = 0,
      draws = 0;

    logInfo(
      `--- Series vs ${opponentName} (${event.format}) | PAK:${pakStrength.overall} vs ${opponentName}:${opponentStrength} ---`
    );

    for (let i = 0; i < event.matches; i++) {
      const matchResult = simulateMatch(
        pakStrength,
        opponentStrength,
        event.format,
        pitchPrep,
        roller,
        event.location,
        i, // Pass match index within series
        opponentName
      );

      // Store detailed match history
      if (!gameState.matchHistory) gameState.matchHistory = [];
      gameState.matchHistory.push({
        year: gameState.year,
        format: event.format,
        opponent: opponentName,
        location: event.location, // Store location in history
        result: matchResult.result, // Store simplified result string
        scorecard: matchResult.scorecard, // Store detailed scorecard
      });

      // Log match outcome and update series score
      if (matchResult.result === "Pakistan Win") {
        logWin(
          ` Match ${i + 1}: Pakistan WIN! (${matchResult.pakScore} vs ${
            matchResult.oppScore
          })`
        );
        pakWins++;
        totalWinsInEvent++;
      } else if (matchResult.result === "Opponent Win") {
        logLoss(
          ` Match ${i + 1}: ${opponentName} WIN! (${matchResult.pakScore} vs ${
            matchResult.oppScore
          })`
        );
        oppWins++;
      } else if (matchResult.result.includes("Tied") && matchResult.scorecard.winner === "Pakistan") {
        // Tie-breaker win for Pakistan
        logWin(
          ` Match ${i + 1}: TIE - Pakistan wins tie-breaker! (${matchResult.pakScore} vs ${
            matchResult.oppScore
          })`
        );
        pakWins++;
        totalWinsInEvent++;
      } else if (matchResult.result.includes("Tied")) {
        // Tie-breaker win for opponent
        logLoss(
          ` Match ${i + 1}: TIE - ${opponentName} wins tie-breaker! (${matchResult.pakScore} vs ${
            matchResult.oppScore
          })`
        );
        oppWins++;
      } else {
        // Draw (Test matches only)
        logDraw(
          ` Match ${i + 1}: DRAW (${matchResult.pakScore} vs ${
            matchResult.oppScore
          })`
        );
        draws++;
      }
    }

    // Determine series result
    if (pakWins > oppWins)
      eventResultSummary = `PAK wins series ${pakWins}-${oppWins}`;
    else if (oppWins > pakWins)
      eventResultSummary = `${opponentName} wins series ${oppWins}-${pakWins}`;
    else eventResultSummary = `Series Drawn ${pakWins}-${oppWins}`;
    if (draws > 0 && event.format === "Test") eventResultSummary += ` (${draws} Draws)`;

    logInfo(`--- Series Result: ${eventResultSummary} ---`);

    // Add to bilateral history list
    gameState.bilateralHistory.push({
      year: gameState.year,
      type: "Bilateral",
      opponent: opponentName,
      location: event.location,
      format: event.format,
      result: eventResultSummary,
    });
    // Keep history list trimmed
    if (gameState.bilateralHistory.length > MAX_HISTORY_LENGTH) {
      gameState.bilateralHistory.shift();
    }
  } else if (event.type === "Tournament") {
    opponentName = `Tournament Opponent`; // Generic for tournaments
    const avgOpponentStrength = Math.round(
      Object.values(gameState.opponents).reduce((a, b) => a + b, 0) /
        Object.keys(gameState.opponents).length
    );
    opponentStrength = avgOpponentStrength; // Use average for tournament matches baseline

    logInfo(
      `--- ${event.name} (${event.format}) | PAK:${
        pakStrength.overall
      } vs Avg Opp:${avgOpponentStrength} (Host: ${
        event.host || event.location
      }) ---`
    );

    // Simplified tournament simulation (e.g., 4 group games, need 3 wins for final)
    const groupMatches = 4;
    const winsNeededForFinal = 3;
    let groupWins = 0;

    logInfo("Group Stage:");
    for (let i = 0; i < groupMatches; i++) {
      // Vary opponent strength slightly around the average for each group match
      const currentOppStrength = Math.max(
        50,
        Math.min(99, avgOpponentStrength + (Math.random() * 20 - 10))
      );
      // Before running the tournament match simulation, generate a random opponent name
      const randomOpponentName = Object.keys(gameState.opponents)[
        Math.floor(Math.random() * Object.keys(gameState.opponents).length)
      ];

      // Simulate the match
      const matchResult = simulateMatch(
        pakStrength,
        currentOppStrength,
        event.format,
        "balanced",
        "standard",
        "Neutral",
        i, // Pass match index within tournament
        randomOpponentName // Pass the random opponent name
      );

      // Store match in history with the random opponent name
      if (!gameState.matchHistory) gameState.matchHistory = [];
      gameState.matchHistory.push({
        year: gameState.year,
        format: event.format,
        opponent: randomOpponentName,
        location: event.host || event.location,
        result: matchResult.result,
        scorecard: matchResult.scorecard,
      });

      if (matchResult.result === "Pakistan Win") {
        logWin(
          ` Grp Match ${i + 1}: WIN vs ${randomOpponentName} (Str ${Math.round(
            currentOppStrength
          )}) (${matchResult.pakScore}-${matchResult.oppScore})`
        );
        groupWins++;
        totalWinsInEvent++;
      } else if (matchResult.result === "Opponent Win") {
        logLoss(
          ` Grp Match ${i + 1}: LOSS vs ${randomOpponentName} (Str ${Math.round(
            currentOppStrength
          )}) (${matchResult.pakScore}-${matchResult.oppScore})`
        );
      } else if (matchResult.result.includes("Tied") && matchResult.scorecard.winner === "Pakistan") {
        // Tie-breaker win for Pakistan
        logWin(
          ` Grp Match ${i + 1}: TIE - Pakistan wins tie-breaker vs ${randomOpponentName} (Str ${Math.round(
            currentOppStrength
          )}) (${matchResult.pakScore}-${matchResult.oppScore})`
        );
        groupWins++;
        totalWinsInEvent++;
      } else if (matchResult.result.includes("Tied")) {
        // Tie-breaker win for opponent
        logLoss(
          ` Grp Match ${i + 1}: TIE - ${randomOpponentName} wins tie-breaker (Str ${Math.round(
            currentOppStrength
          )}) (${matchResult.pakScore}-${matchResult.oppScore})`
        );
      } else {
        // Draw (Test matches only)
        logDraw(
          ` Grp Match ${
            i + 1
          }: DRAW vs ${randomOpponentName} (Str ${Math.round(
            currentOppStrength
          )}) (${matchResult.pakScore}-${matchResult.oppScore})`
        );
        // Could award 0.5 wins for a draw in tournament standings if needed
      }
    }

    // Check qualification for final
    if (groupWins >= winsNeededForFinal) {
      logInfo(`Qualified for the Final! (${groupWins}/${groupMatches} wins)`);

      // Generate a random opponent name for the final
      const finalOpponentName = Object.keys(gameState.opponents)[
        Math.floor(Math.random() * Object.keys(gameState.opponents).length)
      ];

      // Simulate final against a strong opponent
      const finalOpponentStrength = Math.max(
        88,
        avgOpponentStrength + 10 + Math.random() * 5
      ); // Final opponent is tough
      const finalResult = simulateMatch(
        pakStrength,
        finalOpponentStrength,
        event.format,
        "balanced",
        "standard",
        "Neutral",
        groupMatches, // Use group matches count as index to space the final from group matches
        finalOpponentName
      );

      // Store final match history
      if (!gameState.matchHistory) gameState.matchHistory = [];
      gameState.matchHistory.push({
        year: gameState.year,
        format: event.format,
        opponent: finalOpponentName,
        location: event.host || event.location,
        result: finalResult.result,
        scorecard: finalResult.scorecard,
      });

      if (finalResult.result === "Pakistan Win") {
        eventResultSummary = `WON Tournament! 🏆`;
        logTrophy(
          ` FINAL: Pakistan WIN the ${event.name}! (${finalResult.pakScore}-${finalResult.oppScore})`
        );
        totalWinsInEvent++; // Count final win
        // Add to tournament wins list
        gameState.tournamentWins.push({
          year: gameState.year,
          name: event.name,
          format: event.format,
        });
        triggerFireworks(); // Display fireworks on win!
      } else {
        eventResultSummary = `Lost Tournament Final`;
        logLoss(
          ` FINAL: Lost vs ${finalOpponentName} (Str ${Math.round(
            finalOpponentStrength
          )}) (${finalResult.pakScore}-${finalResult.oppScore})`
        );
      }
    } else {
      eventResultSummary = `Eliminated in Group Stage (${groupWins}/${groupMatches} wins)`;
      logInfo(`--- Result: ${eventResultSummary} ---`);
    }
    logInfo(`--- Tournament Result: ${eventResultSummary} ---`);
  }

  // --- Post-Event Updates ---
  simulatePunditry(eventResultSummary); // Get pundit reaction
  checkAttitudeEvents(); // Check for volatile player issues
  // applyTrainingAndDevelopment(); // Development happens annually, not after each event

  // Advance to next event index
  gameState.currentEventIndex++;

  // --- UI Feedback: Re-enable button and restore text ---
  if (uiElements.simulateButton) {
    // Safety check
    // Use setTimeout to allow the UI to potentially update before re-enabling,
    // though synchronous simulation might still make this appear instant.
    setTimeout(() => {
      uiElements.simulateButton.disabled = false;
      uiElements.simulateButton.textContent = "Simulate Next Event";
      renderAllUI(); // Refresh UI after simulation and button reset
    }, 50); // Small delay
  } else {
    renderAllUI(); // Refresh UI even if button somehow missing
  }
}

// --- Initialization & Event Listeners ---

/**
 * Sets up all necessary event listeners for UI elements.
 */
function setupEventListeners() {
  console.log("Checkpoint 8.1: Setting up listeners...");

  // Tab switching
  if (uiElements.tabsContainer) {
    uiElements.tabsContainer.addEventListener("click", (event) => {
      if (event.target.classList.contains("tab-button")) {
        openTab(event.target.getAttribute("data-tab"));
      }
    });
  } else {
    console.error("ERROR: Could not find tabsContainer element!");
  }

  // Simulate button
  if (uiElements.simulateButton) {
    console.log("Checkpoint 8.2: Attaching listener to simulateButton.");
    uiElements.simulateButton.addEventListener("click", simulateNextEvent);
  } else {
    console.error("ERROR: Could not find simulateButton element!");
  }

  // Domestic settings change listeners
  if (uiElements.pitchTypeSelect)
    uiElements.pitchTypeSelect.addEventListener("change", (e) =>
      updateDomesticSetting("pitch", e.target.value)
    );
  else console.error("Missing pitchTypeSelect");

  if (uiElements.ballTypeSelect)
    uiElements.ballTypeSelect.addEventListener("change", (e) =>
      updateDomesticSetting("ball", e.target.value)
    );
  else console.error("Missing ballTypeSelect");

  if (uiElements.batTypeSelect)
    uiElements.batTypeSelect.addEventListener("change", (e) =>
      updateDomesticSetting("bat", e.target.value)
    );
  else console.error("Missing batTypeSelect");

  // Home Pitch/Roller Listeners - Check existence as they might not be visible initially
  if (uiElements.homePitchPrepSelect) {
    uiElements.homePitchPrepSelect.addEventListener("change", (e) => {
      gameState.currentHomePitchPrep = e.target.value;
      logInfo(
        `Home Pitch preparation set to: ${
          e.target.options[e.target.selectedIndex].text
        }`
      );
    });
  } else
    console.warn(
      "homePitchPrepSelect not found (expected if no home game next)."
    );

  if (uiElements.rollerChoiceSelect) {
    uiElements.rollerChoiceSelect.addEventListener("change", (e) => {
      gameState.currentRollerChoice = e.target.value;
      logInfo(
        `Home Roller choice set to: ${
          e.target.options[e.target.selectedIndex].text
        }`
      );
    });
  } else
    console.warn(
      "rollerChoiceSelect not found (expected if no home game next)."
    );

  console.log("Checkpoint 8.3: Finished attaching listeners.");
}

/**
 * Initializes the game. Tries to load saved data, otherwise starts a new game.
 * Sets up default player properties and event listeners.
 * @param {boolean} forceReset - If true, ignores saved data and starts fresh.
 */
function initializeGame(forceReset = false) {
  console.log("Checkpoint 1: initializeGame started.");
  logInfo("Initializing Pakistan Cricket Chairman...");
  let loadedSuccessfully = false;

  // Try loading saved game unless forcing a reset
  if (!forceReset && localStorage.getItem(SAVE_KEY)) {
    console.log("Checkpoint 2: Attempting loadGame().");
    try {
      loadGame(); // loadGame now handles its own success/failure logging and resets
      // If loadGame didn't throw an error or force a reset itself, assume it worked.
      loadedSuccessfully = true;
      console.log("Checkpoint 3: loadGame() finished.");
    } catch (loadError) {
      console.error("Error during loadGame call in initializeGame:", loadError);
      logError("Critical error during game load. Resetting game state.");
      localStorage.removeItem(SAVE_KEY); // Clear potentially corrupt save
      // Proceed to new game setup below
    }
  }

  // If not loaded (no save, forceReset, or load failed), start new game
  if (!loadedSuccessfully) {
    console.log(
      `Checkpoint 4: ${
        forceReset ? "Forcing reset." : "No save or load failed."
      }`
    );
    if (forceReset) {
      logWarning("Game data reset. Starting fresh.");
    } else {
      logInfo("No valid save game found, starting a new game.");
    }
    gameState = getDefaultGameState(); // Get default state
    console.log("Checkpoint 5: getDefaultGameState finished.");
    // Ensure player data is reset to initial state if needed (relying on players.js definition)
    // NOTE: True deep reset of player data often best handled by full page reload after clearing storage.
    // We assume ALL_PLAYERS_DATA is the initial state here unless loaded.

    generateSchedule(gameState.year); // Generate initial schedule
    console.log("Checkpoint 6: generateSchedule finished.");
    renderAllUI(); // Initial render
    console.log("Checkpoint 7: renderAllUI finished (new game setup).");
  }

  setupEventListeners(); // Attach event listeners regardless of load/new
  console.log("Checkpoint 8: setupEventListeners finished.");
  openTab("dashboard"); // Ensure dashboard is the active tab
  if (loadedSuccessfully) {
    logSuccess("Game Ready (Loaded)!"); // Different message if loaded
  } else {
    logSuccess("New Game Ready!");
  }

  console.log("Checkpoint 9: initializeGame finished.");
}

// --- Initial DOM Load & Setup ---
document.addEventListener("DOMContentLoaded", () => {
  console.log("Checkpoint 0: DOMContentLoaded event fired.");
  // Ensure all players have default properties (Safety check)
  try {
    ALL_PLAYERS_DATA.forEach((p) => {
      p.age = p.age ?? 25;
      p.attitude = p.attitude ?? "Neutral";
      p.heightInches = p.heightInches ?? 70;
      p.weightLbs = p.weightLbs ?? 165;
      p.fitness = p.fitness ?? 85;
      p.batting = p.batting ?? 50;
      p.bowling = p.bowling ?? 50;
      p.fielding = p.fielding ?? 50;
      p.potential = p.potential ?? 75;
      p.status = p.status ?? "domestic";
      // Ensure bowlingSpeed exists only for Fast Bowlers after potential load/reset
      if (p.role !== "Fast Bowler") delete p.bowlingSpeed;
      else if (!p.bowlingSpeed) p.bowlingSpeed = "135kph"; // Default speed if missing
    });
    console.log("Checkpoint 0.5: Player default properties loop finished.");
  } catch (error) {
    console.error("Error in player default properties loop:", error);
    alert(
      "Error initializing player data. Please check console and consider resetting the game."
    );
  }

  // Initialize the game logic after ensuring player data is okay
  initializeGame();
});

// --- NEW: Function to clear Chairman's Microsoft Teams ---
function clearMessageLog() {
  clearMessageLogUI();
  logInfo("Chairman's Microsoft Teams cleared by user."); // Log the action itself
}

// --- Expose functions needed by HTML onclick attributes ---
window.saveGame = saveGame;
window.loadGame = loadGame;
window.resetGame = resetGame;
window.selectPlayer = selectPlayer;
window.deselectPlayer = deselectPlayer;
window.setTrainingFocus = setTrainingFocus;
window.autoSelectSquad = autoSelectSquad;
window.clearSelections = clearSelections;
window.bulkTrainFielding = bulkTrainFielding;
window.bulkTrainPrimaryRole = bulkTrainPrimaryRole;
window.bulkTrainFitness = bulkTrainFitness;
window.upgradeFacilities = upgradeFacilities;
window.upgradeCoaching = upgradeCoaching;
window.upgradeCoachingInstitute = upgradeCoachingInstitute; // Expose new upgrade
window.upgradeHighPerformance = upgradeHighPerformance; // Expose new upgrade
window.upgradeStadiumFeature = upgradeStadiumFeature;
window.viewScoutingReport = viewScoutingReport;
window.clearMessageLog = clearMessageLog;

function getDefaultStadiumsState() {
  return {
    Karachi: {
      name: "National Stadium Karachi",
      features: {
        stands: { level: 3, maxLevel: 5, name: "Stands" },
        floodlights: { level: 1, maxLevel: 3, name: "Floodlights" },
        screen: { level: 1, maxLevel: 3, name: "Giant Screen" },
        facilities: { level: 2, maxLevel: 4, name: "Fan Facilities" }
      }
    },
    Lahore: {
      name: "Gaddafi Stadium Lahore",
      features: {
        stands: { level: 3, maxLevel: 5, name: "Stands" },
        floodlights: { level: 1, maxLevel: 3, name: "Floodlights" },
        screen: { level: 1, maxLevel: 3, name: "Giant Screen" },
        facilities: { level: 2, maxLevel: 4, name: "Fan Facilities" }
      }
    },
    Rawalpindi: {
      name: "Rawalpindi Cricket Stadium",
      features: {
        stands: { level: 2, maxLevel: 5, name: "Stands" },
        floodlights: { level: 1, maxLevel: 3, name: "Floodlights" },
        screen: { level: 1, maxLevel: 3, name: "Giant Screen" },
        facilities: { level: 1, maxLevel: 4, name: "Fan Facilities" }
      }
    },
    Multan: {
      name: "Multan Cricket Stadium",
      features: {
        stands: { level: 2, maxLevel: 5, name: "Stands" },
        floodlights: { level: 1, maxLevel: 3, name: "Floodlights" },
        screen: { level: 1, maxLevel: 3, name: "Giant Screen" },
        facilities: { level: 1, maxLevel: 4, name: "Fan Facilities" }
      }
    },
    Faisalabad: {
      name: "Iqbal Stadium Faisalabad",
      features: {
        stands: { level: 1, maxLevel: 5, name: "Stands" },
        floodlights: { level: 0, maxLevel: 3, name: "Floodlights" },
        screen: { level: 0, maxLevel: 3, name: "Giant Screen" },
        facilities: { level: 0, maxLevel: 4, name: "Fan Facilities" }
      }
    }
  };
}

// Helper function to calculate stadium income - extracted from updateBudget
function calculateStadiumIncome() {
  let stadiumIncome = 0;
  // Calculate stadium income from all stadiums
  for (const stadiumName in gameState.stadiums) {
    const stadium = gameState.stadiums[stadiumName];
    for (const featureName in stadium.features) {
      const feature = stadium.features[featureName];
      stadiumIncome += feature.level * STADIUM_INCOME_PER_STAND_LEVEL;
    }
  }
  return stadiumIncome;
}

// Helper function to calculate facility maintenance - extracted from updateBudget
function calculateFacilityMaintenance() {
  let facilityMaintenance = 0;
  // Calculate facility maintenance costs
  facilityMaintenance += gameState.facilityLevel * 0.5;
  facilityMaintenance += gameState.coachLevel * 0.5;
  facilityMaintenance += gameState.coachingInstituteLevel * 0.5;
  facilityMaintenance += gameState.highPerformanceLevel * 0.5;
  return facilityMaintenance;
}
