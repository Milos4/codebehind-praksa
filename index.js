const fs = require("fs");

// Ucitavanje podataka iz fajlova
const groups = JSON.parse(fs.readFileSync("groups.json"));
const exhibitions = JSON.parse(fs.readFileSync("exibitions.json"));

Object.keys(groups).forEach((group) => {
  groups[group].forEach((team) => {
    team.wins = 0;
    team.losses = 0;
    team.points = 0;
    team.scored = 0;
    team.conceded = 0;
    team.pointDiff = 0;

    team.form = 0;
    team.matchesPlayed = 0;
  });
});

// Funkcija koja izracunava pocetnu formu timova na osnovu rezultata prijateljskih utakmica
function calculateInitialForm() {
  Object.keys(exhibitions).forEach((teamKey) => {
    const teamExhibitions = exhibitions[teamKey];
    let formScore = 0;

    teamExhibitions.forEach((match) => {
      const [teamScore, opponentScore] = match.Result.split("-").map(Number);
      if (teamScore > opponentScore) {
        formScore += 3;
      } else {
        formScore += 1;
      }
      formScore += (teamScore - opponentScore) / 10;
    });

    Object.keys(groups).forEach((grp) => {
      const team = groups[grp].find((t) => t.Team === teamKey);
      if (team) {
        team.form = formScore;
        team.matchesPlayed = teamExhibitions.length;
      }
    });
  });
}
calculateInitialForm();

// Funkcija koja updejtuje formu tima na osnovu rezultata odigrane utakmice
function updateForm(team, scored, conceded, opponent) {
  const pointDifference = scored - conceded;

  if (pointDifference > 0) {
    team.form += 3;
  } else {
    team.form += 1;
  }

  const opponentForm = opponent.form || 0;
  team.form += opponentForm / 10;

  team.form += pointDifference / 20;

  team.matchesPlayed += 1;
}

// Funkcija koja simulira jednu utakmicu između dva tima grupne faze
function simulateMatch(team1, team2) {
  const score1 = Math.floor(Math.random() * 100) + 60;
  const score2 = Math.floor(Math.random() * 100) + 60;

  team1.scored += score1;
  team1.conceded += score2;
  team2.scored += score2;
  team2.conceded += score1;

  if (score1 > score2) {
    team1.wins++;
    team1.points += 2;
    team2.losses++;
    team2.points += 1;
  } else {
    team2.wins++;
    team2.points += 2;
    team1.losses++;
    team1.points += 1;
  }

  team1.pointDiff = team1.scored - team1.conceded;
  team2.pointDiff = team2.scored - team2.conceded;

  updateForm(team1, score1, score2, team2);
  updateForm(team2, score2, score1, team1);

  return `${team1.Team} - ${team2.Team} (${score1}:${score2})`;
}

// Funkcija koja generise sve utakmice za jednu grupu
function generateMatches(group) {
  return [
    [
      [group[0], group[1]],
      [group[2], group[3]],
    ], // 1. kolo
    [
      [group[0], group[2]],
      [group[1], group[3]],
    ], // 2. kolo
    [
      [group[0], group[3]],
      [group[1], group[2]],
    ], // 3. kolo
  ];
}

// Funkcija koja simulira jedno kolo utakmica u grupnoj fazi
function simulateRound(round, roundMatches) {
  console.log(`Grupna faza - ${round}. kolo:`);
  Object.keys(groups).forEach((grp) => {
    console.log(`Grupa ${grp}:`);
    const matches = roundMatches[grp][round - 1];
    matches.forEach((match) => {
      console.log(`    ${simulateMatch(match[0], match[1])}`);
    });
  });
}

// Funkcija koja rangira timove u grupi prema broju osvojenih bodova
function rankTeams(group) {
  return group.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.pointDiff !== a.pointDiff) return b.pointDiff - a.pointDiff;
    return b.scored - a.scored;
  });
}

// Funkcija koja prikazuje konacan plasman timova u svim grupama
function displayGroupStandings() {
  console.log("Konačan plasman u grupama:");
  Object.keys(groups).forEach((grp) => {
    const rankedTeams = rankTeams(groups[grp]);
    console.log(
      `    Grupa ${grp} (Ime - pobede/porazi/bodovi/postignuti koševi/primljeni koševi/koš razlika):`
    );
    rankedTeams.forEach((team, index) => {
      console.log(
        `        ${index + 1}. ${team.Team} (${team.wins} / ${team.losses} / ${
          team.points
        } / ${team.scored} / ${team.conceded} / ${team.pointDiff})`
      );
    });
  });
}

// Funkcija koja rangira timove po pozicijama u grupi
function rankTeamsByPosition(groups) {
  const firstPlaceTeams = [];
  const secondPlaceTeams = [];
  const thirdPlaceTeams = [];

  Object.keys(groups).forEach((grp) => {
    const rankedGroup = rankTeams(groups[grp]);
    firstPlaceTeams.push(rankedGroup[0]);
    secondPlaceTeams.push(rankedGroup[1]);
    thirdPlaceTeams.push(rankedGroup[2]);
  });

  const rankedFirstPlaceTeams = rankTeams(firstPlaceTeams);
  const rankedSecondPlaceTeams = rankTeams(secondPlaceTeams);
  const rankedThirdPlaceTeams = rankTeams(thirdPlaceTeams);

  const finalRanking = [
    ...rankedFirstPlaceTeams,
    ...rankedSecondPlaceTeams,
    ...rankedThirdPlaceTeams,
  ];

  return finalRanking;
}

// Funkcija koja prikazuje timove koji su se kvalifikovali za eliminacionu fazu
function displayQualifiedTeams(rankedTeams) {
  console.log("\nTimovi koji prolaze u eliminacionu fazu:");
  rankedTeams.slice(0, 8).forEach((team, index) => {
    console.log(`    Rang ${index + 1}: ${team.Team}`);
  });

  console.log("\nTim koji ne prolazi dalje:");
  console.log(`    Rang 9: ${rankedTeams[8].Team}`);
}

// Funkcija koja kreira 4 sesira
function drawPots(teams) {
  const pots = {
    D: [],
    E: [],
    F: [],
    G: [],
  };

  const topTeams = teams.slice(0, 8);

  topTeams.forEach((team, index) => {
    if (index < 2) pots.D.push(team);
    else if (index < 4) pots.E.push(team);
    else if (index < 6) pots.F.push(team);
    else pots.G.push(team);
  });

  return pots;
}

// Funkcija koja prikazuje timove u svakom sesiru
function displayPots(pots) {
  console.log("Šeširi:");
  Object.keys(pots).forEach((potKey) => {
    console.log(`     Šešir ${potKey}:`);
    pots[potKey].forEach((team) => {
      console.log(`        ${team.Team}`);
    });
  });
}

// Funkcija koja proverava da li su dva tima igrala jedan protiv drugog u grupnoj fazi
function havePlayedBefore(team1, team2) {
  let sameGroup = false;

  Object.keys(groups).forEach((groupKey) => {
    const group = groups[groupKey];
    const team1InGroup = group.some((t) => t.Team === team1.Team);
    const team2InGroup = group.some((t) => t.Team === team2.Team);

    if (team1InGroup && team2InGroup) {
      sameGroup = true;
    }
  });

  return sameGroup;
}

// Funkcija koja mesa elemente u nizu
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Funkcija koja generise parove timova za četvrtfinale
function generateQuarterfinalPairs(pots) {
  const quarterfinals = [];

  const potD = [...pots.D];
  const potG = [...pots.G];
  shuffle(potD);
  shuffle(potG);

  while (potD.length && potG.length) {
    let team1 = potD.pop();
    let team2 = potG.pop();

    if (havePlayedBefore(team1, team2)) {
      potG.push(team2);
      potD.push(team1);
      shuffle(potD);
      shuffle(potG);
      team1 = potD.pop();
      team2 = potG.pop();
    }

    quarterfinals.push([team1, team2]);
  }

  const potE = [...pots.E];
  const potF = [...pots.F];
  shuffle(potE);
  shuffle(potF);

  while (potE.length && potF.length) {
    let team1 = potE.pop();
    let team2 = potF.pop();

    if (havePlayedBefore(team1, team2)) {
      potF.push(team2);
      potE.push(team1);
      shuffle(potE);
      shuffle(potF);
      team1 = potE.pop();
      team2 = potF.pop();
    }

    quarterfinals.push([team1, team2]);
  }

  const orderedQuarterfinals = [];
  for (let i = 0; i < 2; i++) {
    if (quarterfinals[i]) orderedQuarterfinals.push(quarterfinals[i]);
    if (quarterfinals[i + 2]) orderedQuarterfinals.push(quarterfinals[i + 2]);
  }

  return orderedQuarterfinals;
}

// Funkcija koja prikazuje parove za cetvrtfinale
function displayEliminationPhase(quarterfinals) {
  console.log("\nEliminaciona faza:");
  quarterfinals.forEach((pair, index) => {
    console.log(`    ${pair[0].Team} - ${pair[1].Team}`);
    if (index === 1) {
      console.log();
    }
  });
  console.log();
}

// Funkcija koja simulira eliminacioni mec izmedju dva tima
function simulateEliminationMatch(team1, team2) {
  const formFactor1 = 1 + team1.form / 100;
  const formFactor2 = 1 + team2.form / 100;

  const baseScore1 = Math.floor(Math.random() * 40) + 60;
  const baseScore2 = Math.floor(Math.random() * 40) + 60;

  const score1 = Math.floor(baseScore1 * formFactor1);
  const score2 = Math.floor(baseScore2 * formFactor2);

  console.log(`    ${team1.Team} - ${team2.Team} (${score1}:${score2})`);

  let result;
  if (score1 > score2) {
    result = { winner: team1, loser: team2, score: `${score1}:${score2}` };
  } else {
    result = { winner: team2, loser: team1, score: `${score2}:${score1}` };
  }

  updateForm(
    result.winner,
    Math.max(score1, score2),
    Math.min(score1, score2),
    result.loser
  );
  updateForm(
    result.loser,
    Math.min(score1, score2),
    Math.max(score1, score2),
    result.winner
  );

  return result;
}

// Funkcija koja simulira sve cetvrtfinalne meceve
function simulateQuarterfinals(quarterfinalPairs) {
  console.log("Četvrtfinale:");
  const semifinalists = [];

  quarterfinalPairs.forEach((match) => {
    const result = simulateEliminationMatch(match[0], match[1]);
    semifinalists.push(result.winner);
  });

  console.log();
  return semifinalists;
}

// Funkcija koja simulira sve polufinalne meceve
function simulateSemifinals(semifinalPairs) {
  console.log("Polufinale:");
  const finalists = [];
  const thirdPlaceCandidates = [];

  semifinalPairs.forEach((match) => {
    const result = simulateEliminationMatch(match[0], match[1]);
    finalists.push(result.winner);
    thirdPlaceCandidates.push(result.loser);
  });

  console.log();
  return { finalists, thirdPlaceCandidates };
}

// Funkcija koja simulira mec za trece mesto
function simulateThirdPlaceMatch(thirdPlaceCandidates) {
  console.log("Utakmica za treće mesto:");
  const result = simulateEliminationMatch(
    thirdPlaceCandidates[0],
    thirdPlaceCandidates[1]
  );
  console.log();
  return result.winner;
}

// Funkcija koja simulira finalni mec
function simulateFinal(finalists) {
  console.log("Finale:");
  const result = simulateEliminationMatch(finalists[0], finalists[1]);
  console.log();
  return result.winner;
}

// Funkcija koja upravlja celokupnom eliminacionom fazom turnira
function simulateEliminationPhase(quarterfinalPairs) {
  const semifinalists = simulateQuarterfinals(quarterfinalPairs);

  const semifinalPairs = [
    [semifinalists[0], semifinalists[1]],
    [semifinalists[2], semifinalists[3]],
  ];

  const { finalists, thirdPlaceCandidates } =
    simulateSemifinals(semifinalPairs);

  const thirdPlaceWinner = simulateThirdPlaceMatch(thirdPlaceCandidates);

  const finalWinner = simulateFinal(finalists);

  console.log("Medalje:");
  console.log(`    1. ${finalWinner.Team}`);
  console.log(
    `    2. ${finalists.find((team) => team.Team !== finalWinner.Team).Team}`
  );
  console.log(`    3. ${thirdPlaceWinner.Team}`);
}

const roundMatches = {};
Object.keys(groups).forEach((grp) => {
  roundMatches[grp] = generateMatches(groups[grp]);
});

simulateRound(1, roundMatches);
simulateRound(2, roundMatches);
simulateRound(3, roundMatches);

displayGroupStandings();

const finalRanking = rankTeamsByPosition(groups);

displayQualifiedTeams(finalRanking);

const pots = drawPots(finalRanking);

displayPots(pots);

const quarterfinalPairs = generateQuarterfinalPairs(pots);
displayEliminationPhase(quarterfinalPairs);

simulateEliminationPhase(quarterfinalPairs);
