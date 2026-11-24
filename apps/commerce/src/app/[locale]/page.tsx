import { getCatalog } from "@swiss/contracts/api";
import { Catalog } from "./catalog";
import { Recommendations } from "./client-widgets";

export const revalidate = 3600;

export default async function CommerceHome() {
  let products: Awaited<ReturnType<typeof getCatalog>> = [];
  try {
    products = await getCatalog();
  } catch {
    products = [];
  }
  return (
    <>
      <h1>Catalog</h1>
      <Catalog products={products} tenantId={process.env.DEMO_TENANT_ID ?? ""} />
      <Recommendations skus={products.map((product) => product.sku)} />
    </>
  );
}
