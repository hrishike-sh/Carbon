function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function breakArray(array, chunkSize) {
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 1) {
    throw new RangeError('Chunk size must be a positive safe integer');
  }
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

module.exports = { sleep, shuffle, breakArray };
