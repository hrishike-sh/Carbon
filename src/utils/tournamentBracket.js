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

async function loadBracketAvatars(entrants) {
  const { loadImage } = require('@napi-rs/canvas');
  await Promise.all(entrants.map(async (entrant) => {
    try {
      const response = await fetch(entrant.avatarUrl, { signal: AbortSignal.timeout(2500) });
      if (response.ok) entrant.avatar = await loadImage(Buffer.from(await response.arrayBuffer()));
    } catch {
      // A missing avatar falls back to the fighter's initial.
    }
  }));
}

function drawPlayer(ctx, player, x, y, width, color, placeholder) {
  ctx.fillStyle = player ? '#344264' : '#222b3e';
  ctx.beginPath();
  ctx.arc(x + 11, y, 11, 0, Math.PI * 2);
  ctx.fill();

  if (player?.avatar) {
    ctx.save();
    ctx.clip();
    ctx.drawImage(player.avatar, x, y - 11, 22, 22);
    ctx.restore();
  } else if (player) {
    ctx.fillStyle = '#dfe7ff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Array.from(player.name.trim())[0]?.toUpperCase() || '?', x + 11, y);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = player ? color : '#9aa8c2';
  ctx.font = player ? 'bold 15px sans-serif' : '14px sans-serif';
  const name = player?.name || placeholder;
  if (ctx.measureText(name).width <= width) {
    ctx.fillText(name, x + 32, y);
    return;
  }
  const letters = Array.from(name);
  while (ctx.measureText(letters.join('') + '…').width > width) letters.pop();
  ctx.fillText(letters.join('') + '…', x + 32, y);
}

function renderBracket(rounds) {
  const { createCanvas } = require('@napi-rs/canvas');
  const left = 30;
  const card = rounds.length === 1 ? 390 : 220;
  const column = card + 38;
  const row = 76;
  const top = 144;
  const width = left * 2 + (rounds.length - 1) * column + card;
  const height = top + rounds[0].length * row + 50;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  const final = rounds.at(-1)[0];
  const active = nextMatch(rounds)?.match;
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#1a2240');
  background.addColorStop(1, '#0d1321');
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#aabaff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('FIGHTHUB  /  SINGLE ELIMINATION', left, 28);
  const entrants = rounds[0].reduce((count, { players }) => count + (players[1] ? 2 : 1), 0);
  ctx.textAlign = 'right';
  ctx.fillText(entrants + ' FIGHTERS', width - left, 28);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f7f8ff';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText(final.winner ? 'Championship results' : 'Tournament bracket', left, 65);
  ctx.fillStyle = '#303c5c';
  ctx.fillRect(left, 98, width - left * 2, 1);

  const center = (round, index) => top + (index + 0.5) * row * 2 ** round;
  ctx.lineWidth = 2;
  for (const [round, matches] of rounds.slice(0, -1).entries()) {
    const edge = left + round * column + card;
    for (const [index, match] of matches.entries()) {
      const y = center(round, index);
      const nextY = center(round + 1, Math.floor(index / 2));
      const elbow = edge + (column - card) / 2;
      ctx.strokeStyle = match.winner ? '#55c5a7' : '#485b85';
      ctx.beginPath();
      ctx.moveTo(edge, y);
      ctx.lineTo(elbow, y);
      ctx.lineTo(elbow, nextY);
      ctx.lineTo(edge + column - card, nextY);
      ctx.stroke();
    }
  }

  for (const [round, matches] of rounds.entries()) {
    const x = left + round * column;
    const isFinal = round === rounds.length - 1;
    ctx.fillStyle = isFinal ? '#f6cc78' : '#aabaff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(isFinal ? 'CHAMPIONSHIP' : 'ROUND ' + (round + 1), x, 122);

    for (const [index, match] of matches.entries()) {
      const y = center(round, index);
      const border = match === active ? '#aabaff' : isFinal ? '#b18e56' : '#344465';
      ctx.beginPath();
      ctx.roundRect(x, y - 31, card, 62, 9);
      ctx.fillStyle = match === active ? '#273756' : '#1a253a';
      ctx.fill();
      ctx.strokeStyle = border;
      ctx.stroke();
      ctx.fillStyle = '#344465';
      ctx.fillRect(x + 10, y, card - 20, 1);

      for (const [slot, player] of match.players.entries()) {
        const color = player === match.winner ? (isFinal ? '#f6cc78' : '#82e1bf') : '#edf2ff';
        drawPlayer(ctx, player, x + 10, y - 15 + slot * 30, card - 52, color, round === 0 ? 'Bye' : 'Awaiting winner');
      }
    }
  }

  ctx.fillStyle = final.winner ? '#f6cc78' : '#aabaff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(final.winner ? 'CHAMPION' : 'HIGHLIGHTED MATCH  /  UP NEXT', left, height - 24);
  if (final.winner) {
    ctx.fillStyle = '#f7f8ff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(final.winner.name, left + 100, height - 24, width - left * 2 - 100);
  }
  return canvas.toBuffer('image/png');
}

module.exports = { createBracket, nextMatch, recordWinner, loadBracketAvatars, renderBracket };
