const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:4001";

async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getCurrentUser(authToken) {
  if (!authToken) {
    const error = new Error("Brak tokenu uzytkownika.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${USER_SERVICE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${authToken}`
    }
  });
  const data = await parseJson(response);

  if (!response.ok) {
    const error = new Error(data?.message || "Nie udalo sie pobrac danych uzytkownika.");
    error.status = response.status;
    throw error;
  }

  return data;
}

module.exports = { getCurrentUser };
