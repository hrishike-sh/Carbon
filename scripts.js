/**
 * @param {String} string
 *
 * @returns Calculated value or null
 */
const parseAmount = (string) => {
    // Checks if first digit is valid number
    if (isNaN(string[0])) return null

    // Return if number is like "5e4" etc.
    if (!isNaN(Number(string))) return Number(string)

    // Check for "m", "k" etc. and return value
    if (!string.endsWith('m') && !string.endsWith('k') && !string.endsWith('b'))
        return null

    // Add values of m, k and b
    const val = string[string.length - 1]
    const rawString = string.replace(string[string.length - 1], '')
    const calculated = parseInt(rawString) * StringValues[val]

    // Invalid number
    if (isNaN(calculated)) return null
    else return calculated
}

const StringValues = {
    m: 1e6,
    k: 1e3,
    b: 1e9,
}

module.exports.parseAmount = parseAmount
