export async function rankWithTensorflow(skus: string[], interactions: Record<string, number>) {
  const tf = await import("@tensorflow/tfjs");
  await tf.setBackend("cpu");
  await tf.ready();
  const scores = skus.map((sku) => interactions[sku] ?? 0);
  const tensor = tf.tensor1d(scores);
  const data = await tensor.data();
  tensor.dispose();
  return skus
    .map((sku, index) => ({ sku, score: Number(data[index] ?? 0) }))
    .sort((left, right) => right.score - left.score || left.sku.localeCompare(right.sku))
    .map((item) => item.sku);
}
