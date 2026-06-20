import React from "react";
import { OrderHistory } from "../components/OrderHistory.jsx";
import { RepairHistory } from "../components/RepairHistory.jsx";

export function AccountPage({ user, repairs, orders, changeStatus, changeOrderStatus, clearHistory, navigate }) {
  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <section className="account-card">
          <h1 className="h4 mb-3"><i className="bi bi-person-circle me-2"></i>Twoje konto</h1>
          <p className="mb-1 fw-semibold">{user.firstName} {user.lastName}</p>
          <p className="text-muted small mb-2">{user.email}</p>
          <span className="badge bg-light text-dark">{user.role === "admin" ? "Administrator" : "Klient"}</span>
        </section>
      </div>
      <div className="col-lg-8">
        <OrderHistory user={user} orders={orders} changeOrderStatus={changeOrderStatus} navigate={navigate} />
        <div className="mt-4">
          <RepairHistory user={user} repairs={repairs} changeStatus={changeStatus} clearHistory={clearHistory} />
        </div>
      </div>
    </div>
  );
}

export function AccountGate({ navigate }) {
  return (
    <section className="page-panel page-panel--center empty-state">
      <i className="bi bi-person-lock d-block"></i>
      <h1 className="h4 mb-2">Moje konto</h1>
      <p className="text-secondary mb-3">Zaloguj się, aby zobaczyć zamówienia i naprawy.</p>
      <button className="btn btn-primary" onClick={() => navigate("/logowanie")}>Logowanie</button>
    </section>
  );
}
