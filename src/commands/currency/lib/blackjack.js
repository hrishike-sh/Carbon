function createDeck() {
  const deck = [];
  for (const suit of ['♥', '♦', '♣', '♠']) {
    for (const value of ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']) {
      deck.push({ suit, value });
    }
  }
  return deck;
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function drawCard(deck) {
  return deck.pop();
}

function calculateScore(cards, hidden = false) {
  let score = 0;
  let aces = 0;
  for (const card of hidden ? cards.slice(0, 1) : cards) {
    if (card.value === 'A') {
      aces++;
      score += 11;
    } else {
      score += ['J', 'Q', 'K'].includes(card.value) ? 10 : Number(card.value);
    }
  }
  while (score > 21 && aces > 0) {
    score -= 10;
    aces--;
  }
  return score;
}

function formatHand(hand, hidden = false) {
  return hand.map((card, index) => {
    const value = hidden && index > 0 ? '??' : `${card.suit}${card.value}`;
    return `[\`${value}\`](https://discord.com/invite/fight "nuh uh")`;
  }).join(' ');
}

module.exports = { createDeck, shuffleDeck, drawCard, calculateScore, formatHand };
