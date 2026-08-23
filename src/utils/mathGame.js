function randomInt(min, max, random = Math.random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function generateMathQuestion(random = Math.random) {
  const questionType = random();

  // Calculus questions make up 10% of games. The other three types each have
  // an equal 30% chance.
  if (questionType < 0.1) {
    const coefficient = randomInt(1, 5, random);
    const exponent = randomInt(2, 4, random);
    const value = randomInt(1, 5, random);
    const term = `${coefficient === 1 ? '' : coefficient}x^${exponent}`;
    return {
      expression: `d/dx (${term}) at x = ${value}`,
      answer: coefficient * exponent * (value ** (exponent - 1))
    };
  }

  if (questionType < 0.4) {
    const left = randomInt(25, 500, random);
    const right = randomInt(25, 500, random);
    return { expression: `${left} + ${right}`, answer: left + right };
  }

  if (questionType < 0.7) {
    const left = randomInt(50, 500, random);
    const right = randomInt(10, left, random);
    return { expression: `${left} - ${right}`, answer: left - right };
  }

  const left = randomInt(2, 20, random);
  const right = randomInt(2, 12, random);
  return { expression: `${left} × ${right}`, answer: left * right };
}

function isCorrectMathAnswer(content, answer) {
  if (typeof content !== 'string') return false;
  const value = content.trim();
  if (!/^-?\d+$/.test(value)) return false;
  return Number(value) === answer;
}

module.exports = { generateMathQuestion, isCorrectMathAnswer };
