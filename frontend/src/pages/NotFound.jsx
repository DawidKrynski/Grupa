import React from "react";

export function NotFound({ navigate }) {
  return (
    <section className="page-panel page-panel--center empty-state">
      <i className="bi bi-signpost-split d-block"></i>
      <h3 className="mb-2">Strona nie istnieje</h3>
      <p className="text-secondary mb-3">Adres, którego szukasz, nie został znaleziony.</p>
      <button className="btn btn-primary" onClick={() => navigate("/")}>Wróć na stronę główną</button>
    </section>
  );
}
