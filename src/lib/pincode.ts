export type PincodeLocation = {
  city: string;
  state: string;
};

type PostalOffice = {
  District?: string;
  State?: string;
  Name?: string;
};

type PostalPincodeResponse = Array<{
  Status?: string;
  PostOffice?: PostalOffice[] | null;
}>;

/**
 * Lookup city/state for an Indian PIN via the public India Post API.
 * Returns null on invalid PIN, network failure, or empty result.
 */
export async function lookupPincode(
  pinCode: string,
  signal?: AbortSignal,
): Promise<PincodeLocation | null> {
  const pin = pinCode.trim();
  if (!/^\d{6}$/.test(pin)) return null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      signal,
    });
    if (!res.ok) return null;

    const json = (await res.json()) as PostalPincodeResponse;
    const entry = Array.isArray(json) ? json[0] : null;
    if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) {
      return null;
    }

    const office = entry.PostOffice[0]!;
    const city = (office.District || office.Name || "").trim();
    const state = (office.State || "").trim();
    if (!city && !state) return null;
    return { city, state };
  } catch {
    return null;
  }
}
