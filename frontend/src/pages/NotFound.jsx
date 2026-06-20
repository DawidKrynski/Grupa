import React from "react";

export function NotFound({ navigate }) {
  return (
    <section className="p-4 bg-white border rounded text-center">
      <h3>404</h3>
      <button className="btn btn-primary" onClick={() => navigate("/")}>Główna</button>
    </section>
  );
}
