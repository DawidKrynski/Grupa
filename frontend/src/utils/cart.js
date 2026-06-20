export function loadCartFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("veloshopCart") || "[]");
  } catch {
    return [];
  }
}
