import React from "react";
import { OrderHistory } from "../components/OrderHistory.jsx";
import { RepairHistory } from "../components/RepairHistory.jsx";

export function AccountPage({ user, repairs, orders, changeStatus, changeOrderStatus, clearHistory, navigate }) {
  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <section className="p-4 bg-white border rounded">
          <h1 className="h4 mb-3">Konto</h1>
          <p className="mb-1"><strong>Zalogowany jako:</strong> {user.firstName} {user.lastName}</p>
          <p className="text-muted small">{user.email}</p>
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
    <section className="p-4 bg-white border rounded">
      <h1 className="h4 mb-3">Moje konto</h1>
      <button className="btn btn-primary" onClick={() => navigate("/logowanie")}>Logowanie</button>
    </section>
  );
}
