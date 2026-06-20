export function statusLabel(status) {
  const labels = {
    booked: "przyjęte",
    accepted: "zaakceptowane",
    in_progress: "w trakcie",
    ready: "gotowe",
    completed: "zrealizowane",
    cancelled: "anulowane"
  };

  return labels[status] || status;
}

export function orderStatusLabel(status) {
  const labels = {
    pending: "oczekujące",
    paid: "opłacone",
    failed: "płatność nieudana",
    shipped: "wysłane",
    completed: "zrealizowane",
    cancelled: "anulowane"
  };

  return labels[status] || status;
}

export function orderStatusBadgeClass(status) {
  if (["paid", "shipped", "completed"].includes(status)) return "bg-success";
  if (status === "failed") return "bg-danger";
  if (status === "cancelled") return "bg-dark";
  return "bg-secondary";
}

export function paymentMethodLabel(method) {
  const labels = { card: "Karta płatnicza", blik: "BLIK" };
  return labels[method] || method;
}
