import React from "react";
import { orderAdminStatuses } from "../constants/statuses.js";
import { orderStatusBadgeClass, orderStatusLabel, paymentMethodLabel } from "../utils/labels.js";

export function OrderDetailsPage({ order, loading, user, navigate, changeOrderStatus, onRetryPayment }) {
  if (loading) {
    return (
      <div className="page-panel text-center py-5">
        <div className="spinner-border text-primary mb-2" role="status"></div>
        <div className="text-muted">Ładowanie zamówienia...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <section className="page-panel page-panel--center empty-state">
        <i className="bi bi-receipt d-block"></i>
        <h1 className="h4 mb-3">Nie znaleziono zamówienia</h1>
        <button className="btn btn-primary" onClick={() => navigate("/moje-konto")}>Moje konto</button>
      </section>
    );
  }

  return (
    <section className="page-panel">
      <button className="btn btn-link p-0 mb-3 text-decoration-none text-primary" onClick={() => navigate("/moje-konto")}>
        <i className="bi bi-arrow-left me-1"></i>Moje konto
      </button>

      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h3 mb-1">Zamówienie #{order.id}</h1>
          <small className="text-muted">
            {new Date(order.createdAt).toLocaleString("pl-PL")}
          </small>
        </div>
        <span className={`badge ${orderStatusBadgeClass(order.status)} p-2`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {order.status === "failed" && (
        <div className="alert alert-danger">
          <strong>Płatność nieudana.</strong>{" "}
          {order.paymentMessage || "Transakcja została odrzucona."}
          <div className="d-flex gap-2 flex-wrap mt-3">
            <button
              type="button"
              className="btn btn-sm btn-danger"
              disabled={loading}
              onClick={() => onRetryPayment(order)}
            >
              {loading ? "Przetwarzanie..." : "Spróbuj opłacić ponownie"}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => navigate("/koszyk")}
            >
              Wróć do koszyka
            </button>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <h2 className="h5 mb-3">Pozycje</h2>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th className="text-center">Ilość</th>
                  <th className="text-end">Cena</th>
                  <th className="text-end">Razem</th>
                </tr>
              </thead>
              <tbody>
                {(order.OrderItems || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">{item.unitPrice.toFixed(2)} PLN</td>
                    <td className="text-end">{(item.unitPrice * item.quantity).toFixed(2)} PLN</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end fw-bold">Suma:</td>
                  <td className="text-end fw-bold">{order.totalAmount.toFixed(2)} PLN</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="summary-box">
            <h2 className="h5 mb-3">Dane zamówienia</h2>
            <dl className="small mb-0">
              <dt className="text-muted">Adres dostawy</dt>
              <dd>{order.deliveryAddress}</dd>
              <dt className="text-muted">Metoda płatności</dt>
              <dd>{paymentMethodLabel(order.paymentMethod)}</dd>
              {order.paymentTransactionId && (
                <>
                  <dt className="text-muted">ID transakcji</dt>
                  <dd>{order.paymentTransactionId}</dd>
                </>
              )}
              {order.paymentMessage && (
                <>
                  <dt className="text-muted">Płatność</dt>
                  <dd>{order.paymentMessage}</dd>
                </>
              )}
              {user?.role === "admin" && (
                <>
                  <dt className="text-muted">Klient</dt>
                  <dd>{order.userEmail}</dd>
                </>
              )}
            </dl>
          </div>

          {user?.role === "admin" && ["paid", "shipped"].includes(order.status) && (
            <div className="admin-box mt-3">
              <h3 className="h6 fw-bold mb-2">Zmiana statusu</h3>
              <div className="d-flex gap-2 flex-wrap">
                {orderAdminStatuses.map((status) => (
                  <button
                    key={status.value}
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => changeOrderStatus(order, status.value)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function OrderGate({ navigate }) {
  return (
    <section className="page-panel page-panel--center empty-state">
      <i className="bi bi-receipt-cutoff d-block"></i>
      <h1 className="h4 mb-2">Szczegóły zamówienia</h1>
      <p className="text-secondary mb-3">Zaloguj się, aby zobaczyć zamówienie.</p>
      <button className="btn btn-primary" onClick={() => navigate("/logowanie")}>Logowanie</button>
    </section>
  );
}
