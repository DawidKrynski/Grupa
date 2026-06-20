import React from "react";

export function CartPage({ cart, cartTotal, user, checkoutForm, setCheckoutForm, onRemove, onUpdateQuantity, onClearCart, onSubmitOrder, loading, navigate }) {
  if (cart.length === 0) {
    return (
      <section className="page-panel page-panel--center empty-state">
        <i className="bi bi-cart-x d-block"></i>
        <h1 className="h4 mb-2">Koszyk jest pusty</h1>
        <p className="text-secondary mb-3">Dodaj produkty ze sklepu, aby złożyć zamówienie.</p>
        <button className="btn btn-primary" onClick={() => navigate("/zakupy")}>Przejdź do sklepu</button>
      </section>
    );
  }

  return (
    <section className="page-panel">
      <div className="page-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <h1 className="h3 mb-0">Koszyk</h1>
          <p>{cart.length} {cart.length === 1 ? "produkt" : "produkty"} w koszyku</p>
        </div>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onClearCart}>
          <i className="bi bi-trash me-1"></i>Wyczyść koszyk
        </button>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="d-flex flex-column gap-3">
            {cart.map((item) => (
              <div className="cart-item d-flex gap-3 align-items-center flex-wrap" key={item.productId}>
                <img src={item.imageUrl} alt={item.name} className="rounded" style={{ width: "80px", height: "80px", objectFit: "cover" }} />
                <div className="flex-grow-1">
                  <strong className="d-block">{item.name}</strong>
                  <span className="text-muted small">{item.price.toFixed(2)} PLN / szt.</span>
                  <span className="text-muted small d-block">Dostępne: {item.stock} szt.</span>
                  {item.quantity >= item.stock && (
                    <span className="text-warning small">Osiągnięto limit stanu magazynowego</span>
                  )}
                </div>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  style={{ width: "72px" }}
                  min="1"
                  max={item.stock}
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.productId, e.target.value)}
                />
                <strong className="text-nowrap">{(item.price * item.quantity).toFixed(2)} PLN</strong>
                <button className="btn btn-sm btn-outline-danger" onClick={() => onRemove(item.productId)} title="Usuń">
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="col-lg-5">
          <div className="summary-box">
            <h2 className="h5 mb-3">Podsumowanie</h2>
            <div className="d-flex justify-content-between total-row">
              <span>Razem:</span>
              <strong>{cartTotal.toFixed(2)} PLN</strong>
            </div>

            {!user && (
              <div className="alert alert-warning py-2 small mt-3 mb-0">
                Zaloguj się, aby złożyć zamówienie.
              </div>
            )}

            <form onSubmit={onSubmitOrder} className="mt-3">
              <div className="mb-3">
                <label className="form-label small">Adres dostawy</label>
                <input
                  className="form-control"
                  placeholder="ul. Rowerowa 1, Warszawa"
                  value={checkoutForm.deliveryAddress}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, deliveryAddress: e.target.value })}
                  disabled={!user || loading}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label small">Metoda płatności</label>
                <select
                  className="form-select"
                  value={checkoutForm.paymentMethod}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, paymentMethod: e.target.value })}
                  disabled={!user || loading}
                >
                  <option value="card">Karta płatnicza</option>
                  <option value="blik">BLIK</option>
                </select>
              </div>
              <button className="btn btn-success w-100" disabled={!user || loading}>
                {loading ? "Przetwarzanie..." : "Złóż i opłać zamówienie"}
              </button>
              {!user && (
                <button type="button" className="btn btn-outline-primary w-100 mt-2" onClick={() => navigate("/logowanie")}>
                  Zaloguj się
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
