import React from "react";

export function HomePage({ navigate }) {
  return (
    <section className="p-4 bg-white border rounded text-center">
      <h1 className="h2 mb-3">VeloShop</h1>
      <p className="text-secondary mb-4">Witaj w systemie obsługi salonu rowerowego.</p>
      <div className="d-flex justify-content-center gap-2">
        <button className="btn btn-primary" onClick={() => navigate("/zakupy")}>Zakupy</button>
        <button className="btn btn-outline-primary" onClick={() => navigate("/koszyk")}>Koszyk</button>
        <button className="btn btn-outline-dark" onClick={() => navigate("/naprawy")}>Serwis napraw</button>
      </div>
    </section>
  );
}
