export function calculateWigProgress(startValue: number, currentValue: number, targetValue: number) {
  const distance = targetValue - startValue

  if (distance === 0) {
    return 100
  }

  return Math.max(0, Math.min(100, Math.round(((currentValue - startValue) / distance) * 100)))
}

export function calculateRemainingToGoal(
  startValue: number,
  currentValue: number,
  targetValue: number,
) {
  if (targetValue >= startValue) {
    return Math.max(targetValue - currentValue, 0)
  }

  if (targetValue < startValue) {
    return Math.max(currentValue - targetValue, 0)
  }

  return 0
}
