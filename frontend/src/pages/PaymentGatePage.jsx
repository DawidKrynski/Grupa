import React from "react";

export function PaymentGatePage({ pendingPayment, loading, onPay, onCancel }) {
  if (!pendingPayment) {
    return (
      <div className="p-4 bg-white border rounded text-center">
        <p className="text-secondary">Brak aktywnej sesji płatności.</p>
        <button className="btn btn-dark btn-sm" onClick={onCancel}>Wróć do serwisu</button>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow-sm border rounded-3 overflow-hidden">
          <div className="bg-primary text-white p-4 text-center">
            <h2 className="h4 mb-1">VPay Secure</h2>
            <small className="opacity-75">Bezpieczna autoryzacja transakcji</small>
          </div>
          <div className="card-body p-4 bg-white">
            <h3 className="h6 text-uppercase text-muted mb-3">Podsumowanie zamówienia</h3>
            <div className="d-flex justify-content-between border-bottom pb-2 mb-3">
              <span>{pendingPayment.serviceName} ({pendingPayment.form.bikeDescription})</span>
              <span className="fw-semibold">{pendingPayment.price.toFixed(2)} zł</span>
            </div>

            <div className="bg-light p-3 rounded mb-4 text-center">
              <span className="small text-secondary d-block">Do zapłaty:</span>
              <span className="fs-2 fw-bold text-dark">{pendingPayment.price.toFixed(2)} PLN</span>
            </div>

            <div className="d-flex flex-column gap-2">
              <button
                className="btn btn-success btn-lg d-flex align-items-center justify-content-center gap-2"
                onClick={onPay}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Przetwarzanie...
                  </>
                ) : (
                  <>Autoryzuj i Zapłać</>
                )}
              </button>
              <button
                className="btn btn-link text-danger btn-sm text-decoration-none"
                onClick={onCancel}
                disabled={loading}
              >
                Anuluj transakcję
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
