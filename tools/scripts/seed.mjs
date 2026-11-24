const authUrl = process.env.AUTH_URL ?? "http://localhost:3001";
const email = process.env.SEED_EMAIL ?? "ada@example.com";
const password = process.env.SEED_PASSWORD ?? "correct-horse-battery";
const name = process.env.SEED_NAME ?? "Ada Lovelace";

const signUp = await fetch(`${authUrl}/api/auth/sign-up/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: authUrl },
  body: JSON.stringify({ email, password, name }),
});
const signUpBody = await signUp.json();
if (!signUp.ok && signUp.status !== 422) {
  console.error(signUpBody);
  process.exit(1);
}

const signIn = await fetch(`${authUrl}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: authUrl },
  body: JSON.stringify({ email, password }),
});
const cookie = signIn.headers.getSetCookie?.().join("; ") ?? signIn.headers.get("set-cookie") ?? "";
const organization = await fetch(`${authUrl}/api/auth/organization/create`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: authUrl, cookie },
  body: JSON.stringify({ name: "Oficina Norte", slug: "oficina-norte" }),
});
console.log(JSON.stringify({ signUp: signUp.status, signIn: signIn.status, organization: organization.status, cookie: Boolean(cookie) }, null, 2));
