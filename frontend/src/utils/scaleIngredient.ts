const fractionMap: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
}

const commonFractions = [
  { value: 1 / 8, unicode: '⅛' },
  { value: 1 / 6, unicode: '⅙' },
  { value: 1 / 4, unicode: '¼' },
  { value: 1 / 3, unicode: '⅓' },
  { value: 3 / 8, unicode: '⅜' },
  { value: 1 / 2, unicode: '½' },
  { value: 2 / 3, unicode: '⅔' },
  { value: 5 / 8, unicode: '⅝' },
  { value: 3 / 4, unicode: '¾' },
  { value: 5 / 6, unicode: '⅚' },
  { value: 7 / 8, unicode: '⅞' },
].sort((a, b) => a.value - b.value)

const sizeUnits = [
  /^\s*\"/,
  /^\s*'/,
  /^\s*inch(?:es)?(?:\s|$|,|\.|;)/i,
  /^\s*cm(?:\s|$|,|\.|;)/i,
  /^\s*mm(?:\s|$|,|\.|;)/i,
  /^\s*millimeter(?:s)?(?:\s|$|,|\.|;)/i,
  /^\s*centimeter(?:s)?(?:\s|$|,|\.|;)/i,
  /^\s*-inch(?:\s|$|,|\.|;)/i,
  /^\s*-cm(?:\s|$|,|\.|;)/i,
  /^\s*-mm(?:\s|$|,|\.|;)/i,
]

const findClosestFraction = (value: number): string | null => {
  if (value < 0.05) return null

  for (const fraction of commonFractions) {
    if (Math.abs(value - fraction.value) < 0.01) {
      return fraction.unicode
    }
  }

  let closest = commonFractions[0]
  let minDiff = Math.abs(value - closest.value)

  for (let i = 1; i < commonFractions.length; i++) {
    const diff = Math.abs(value - commonFractions[i].value)
    if (diff < minDiff) {
      minDiff = diff
      closest = commonFractions[i]
    }
  }

  return minDiff <= 0.03 ? closest.unicode : null
}

export function scaleIngredient(ingredient: string, scale: number): string {
  if (scale === 1) return ingredient

  let processedIngredient = ingredient.replace(/(\d+)\/(\d+)/g, (_, numerator: string, denominator: string) => {
    return (parseInt(numerator, 10) / parseInt(denominator, 10)).toString()
  })

  processedIngredient = processedIngredient.replace(/([¼½¾⅓⅔⅛⅜⅝⅞])/g, (match) => {
    return fractionMap[match].toString()
  })

  processedIngredient = processedIngredient.replace(/(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])/g, (_, whole: string, fraction: string) => {
    return (parseInt(whole, 10) + fractionMap[fraction]).toString()
  })

  const scaled = processedIngredient.replace(/(\d+(?:\.\d+)?)/g, (match, ...args) => {
    const offset = args[args.length - 2] as number
    const fullString = args[args.length - 1] as string

    const afterNumber = fullString.slice(offset + match.length)

    if (sizeUnits.some((regex) => regex.test(afterNumber))) {
      return match
    }

    const num = parseFloat(match)
    const result = num * scale

    if (Math.abs(result % 1) < 0.001) return Math.round(result).toString()

    const wholePart = Math.floor(result)
    const fractionPart = result - wholePart

    const fractionChar = findClosestFraction(fractionPart)

    if (fractionChar) {
      return wholePart > 0 ? `${wholePart}${fractionChar}` : fractionChar
    }

    return result < 0.1 ? result.toFixed(2) : result.toFixed(1)
  })

  return scaled
}
