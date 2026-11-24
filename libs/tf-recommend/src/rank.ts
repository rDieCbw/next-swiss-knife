export function rankSkus(skus: string[], interactions: Record<string, number>) {
  return [...skus].sort((left, right) => {
    const score = (interactions[right] ?? 0) - (interactions[left] ?? 0);
    return score === 0 ? left.localeCompare(right) : score;
  });
}
