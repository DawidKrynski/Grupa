export function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit"
  });
}
