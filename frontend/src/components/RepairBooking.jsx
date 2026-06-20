import React from "react";

export function RepairBooking({ user, services, repairForm, setRepairForm, estimate, submitRepair }) {
  return (
    <div className="page-panel h-100">
      <h2 className="h5 mb-3">Zlecenie naprawy</h2>
      {!user && <div className="alert alert-warning py-1 small">Zaloguj się, by złożyć zlecenie.</div>}
      <form onSubmit={submitRepair}>
        <select className="form-select mb-2" value={repairForm.repairServiceId} onChange={(e) => setRepairForm({ ...repairForm, repairServiceId: e.target.value })}>
          <option value="">Wybierz naprawę</option>
          {services.map((s) => <option key={s.id} value={s.id}>{s.name} - {s.price} zł</option>)}
        </select>
        <input className="form-control mb-2" placeholder="Opis roweru" value={repairForm.bikeDescription} onChange={(e) => setRepairForm({ ...repairForm, bikeDescription: e.target.value })} />
        <textarea className="form-control mb-3" rows="2" placeholder="Opis usterki" value={repairForm.issueDescription} onChange={(e) => setRepairForm({ ...repairForm, issueDescription: e.target.value })} />
        {estimate && <div className="alert alert-light border small py-2 mb-3">Odbiór szacowany: {estimate.readyDate}</div>}
        <button className="btn btn-primary w-100" disabled={!user}>Przejdź do płatności</button>
      </form>
    </div>
  );
}
