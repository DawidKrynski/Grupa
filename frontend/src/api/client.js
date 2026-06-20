export async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Błąd serwera");
  }

  return data;
}
