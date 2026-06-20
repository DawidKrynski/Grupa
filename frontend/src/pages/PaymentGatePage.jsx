import React from "react";

export function PaymentGatePage({ pendingPayment, loading, onPay, onCancel }) {
  if (!pendingPayment) {
    return (
      <section className="page-panel page-panel--center empty-state">
        <i className="bi bi-credit-card-2-front d-block"></i>
        <p className="text-secondary mb-3">Brak aktywnej sesji płatności.</p>
        <button className="btn btn-primary btn-sm" onClick={onCancel}>Wróć do serwisu</button>
      </section>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card payment-card">
          <div className="payment-header text-white p-4 text-center">
            <h2 className="h4 mb-1"><i className="bi bi-shield-lock me-2"></i>VPay Secure</h2>
            <small className="opacity-75">Bezpieczna autoryzacja transakcji</small>
          </div>
          <div className="card-body p-4">
            <h3 className="h6 text-uppercase text-muted mb-3">Podsumowanie</h3>
            <div className="d-flex justify-content-between border-bottom pb-2 mb-3">
              <span>{pendingPayment.serviceName} ({pendingPayment.form.bikeDescription})</span>
              <span className="fw-semibold">{pendingPayment.price.toFixed(2)} zł</span>
            </div>

            <div className="summary-box text-center mb-4">
              <span className="small text-secondary d-block">Do zapłaty</span>
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
                  <>Autoryzuj i zapłać</>
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
