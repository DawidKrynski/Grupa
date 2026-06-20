import React from "react";
import { finalStatuses } from "../constants/statuses.js";
import { statusLabel } from "../utils/labels.js";

export function RepairHistory({ user, repairs, changeStatus, clearHistory }) {
  return (
    <section className="p-4 bg-white border rounded">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Historia napraw</h2>
        {user?.role === "admin" && <button className="btn btn-outline-danger btn-sm" onClick={clearHistory}>Wyczyść</button>}
      </div>
      <div className="row g-2">
        {repairs.map((r) => (
          <div className="col-12 border rounded p-3" key={r.id}>
            <div className="d-flex justify-content-between">
              <strong>{r.bikeDescription}</strong>
              <span className="badge bg-secondary">{statusLabel(r.status)}</span>
            </div>
            <small className="text-muted d-block">Termin: {r.dropOffDate} do {r.readyDate}</small>
            {user?.role === "admin" && !["completed", "cancelled"].includes(r.status) && (
              <div className="d-flex gap-2 mt-2">
                {finalStatuses.map((s) => (
                  <button key={s.value} className="btn btn-sm btn-outline-primary" onClick={() => changeStatus(r, s.value)}>
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
