// Fingerprints never leave the phone: the sensor keeps them, we only remember which passkey belongs to which rider.
const KEY = "rg-fingerprints";

function all(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}
export function saveFingerprint(credId: string, name: string) {
  localStorage.setItem(KEY, JSON.stringify({ ...all(), [credId]: name }));
}

/** Asks the device's fingerprint sensor; returns the rider name or an error. */
export async function verifyFingerprint(): Promise<{ name: string } | { error: string }> {
  const known = all();
  if (!Object.keys(known).length) return { error: "No fingerprint enrolled on this phone. Enrol one on the Family page." };
  try {
    const cred = (await navigator.credentials.get({
      publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), userVerification: "required", timeout: 60000 },
    })) as PublicKeyCredential | null;
    const name = cred && known[cred.id];
    return name ? { name } : { error: "Fingerprint not recognised. Vehicle stays locked." };
  } catch {
    return { error: "Fingerprint check cancelled or not available on this device." };
  }
}
