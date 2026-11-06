const { randomInt } = require('node:crypto');

function createBracket(entrants) {
  const shuffled = [...entrants];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const other = randomInt(index + 1);
    [shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]];
  }

  const size = 2 ** Math.ceil(Math.log2(entrants.length));
  const rounds = [];
  for (let matches = size / 2; matches >= 1; matches /= 2) {
    rounds.push(Array.from({ length: matches }, () => ({ players: [null, null], winner: null })));
  }

  // Spread byes across the bracket so adjacent matches get paired last.
  let pairingOrder = [0];
  while (pairingOrder.length < rounds[0].length) {
    pairingOrder = pairingOrder.flatMap((index) => [index, index + pairingOrder.length]);
  }
  for (const match of rounds[0]) match.players[0] = shuffled.pop();
  for (const index of pairingOrder) {
    const match = rounds[0][index];
    match.players[1] = shuffled.pop() ?? null;
    if (!match.players[1]) recordWinner(rounds, 0, index, match.players[0]);
  }
  return rounds;
}

function recordWinner(rounds, round, index, winner) {
  rounds[round][index].winner = winner;
  const next = rounds[round + 1]?.[Math.floor(index / 2)];
  if (next) next.players[index % 2] = winner;
}

function nextMatch(rounds) {
  for (const [round, matches] of rounds.entries()) {
    const index = matches.findIndex((match) => !match.winner);
    if (index !== -1) return { round, index, match: matches[index] };
  }
  return null;
}

function renderBracket(rounds) {
  const { createCanvas } = require('@napi-rs/canvas');
  const column = 242;
  const row = 60;
  const left = 22;
  const top = 88;
  const width = Math.max(330, left * 2 + column * rounds.length - 26);
  const canvas = createCanvas(width, top + rounds[0].length * row + 10);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f9fafb';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('FightHub tournament', left, 37);
  ctx.font = '15px sans-serif';

  for (const [round, matches] of rounds.entries()) {
    const x = left + round * column;
    const step = row * 2 ** round;
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(round === rounds.length - 1 ? 'FINAL' : 'ROUND ' + (round + 1), x, 68);
    for (const [index, match] of matches.entries()) {
      const y = top + (index + 0.5) * step;
      if (round < rounds.length - 1) {
        const nextY = top + (Math.floor(index / 2) + 0.5) * step * 2;
        ctx.strokeStyle = '#64748b';
        ctx.beginPath();
        ctx.moveTo(x + column - 26, y);
        ctx.lineTo(x + column - 13, y);
        ctx.lineTo(x + column - 13, nextY);
        ctx.lineTo(x + column, nextY);
        ctx.stroke();
      }
      ctx.fillStyle = '#243248';
      ctx.fillRect(x, y - 23, column - 26, 46);
      for (const [slot, player] of match.players.entries()) {
        ctx.fillStyle = player && player === match.winner ? '#86efac' : '#f1f5f9';
        ctx.fillText(player?.name || (round === 0 ? 'Bye' : 'TBD'), x + 9, y - 5 + slot * 19, column - 44);
      }
    }
  }

  return canvas.toBuffer('image/png');
}

module.exports = { createBracket, nextMatch, recordWinner, renderBracket };
