// PIN parent — POC. Le PIN n'est jamais stocké en clair : on garde un hash
// SHA-256 salé dans le localStorage. Limite assumée : sans backend, un
// localStorage effacé = PIN perdu (=> réinitialisation de l'appareil).

const SALT = "per-poc-pin-v1|";

export const isValidPin = (pin: string) => /^\d{4}$/.test(pin);

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(SALT + pin);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return (await hashPin(pin)) === hash;
}
