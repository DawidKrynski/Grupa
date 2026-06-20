import React, { useEffect, useState } from "react";

export function ProductDetailsPage({ product, user, onChangeStock, onAddToCart, navigate }) {
  const [inputStock, setInputStock] = useState(product?.stock ?? 0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!product) return;
    setInputStock(product.stock);
    setQuantity(1);
  }, [product?.id, product?.stock]);

  if (!product) return <div className="p-4 text-center">Ładowanie...</div>;

  function handleStockSubmit(e) {
    e.preventDefault();
    onChangeStock(product.id, inputStock);
  }

  function handleAddToCart() {
    onAddToCart(product, Number(quantity));
  }

  return (
    <section className="p-4 bg-white border rounded">
      <button className="btn btn-link p-0 mb-3 text-decoration-none" onClick={() => navigate("/zakupy")}>← Powrót</button>
      <div className="row g-4">
        <div className="col-md-5">
          <img src={product.imageUrl} alt={product.name} className="img-fluid rounded border" />
        </div>
        <div className="col-md-7">
          <h1 className="h3">{product.name}</h1>
          <h2 className="h4 text-danger fw-bold">{product.price.toFixed(2)} PLN</h2>

          <div className="mt-2 mb-3">
            <span className="badge bg-light text-dark border p-2">
              Dostępność: {product.stock > 0 ? (
                <span className="text-success fw-bold">{product.stock} szt.</span>
              ) : (
                <span className="text-danger fw-bold">Brak na stanie</span>
              )}
            </span>
          </div>

          <p className="mt-3 text-secondary">{product.description}</p>

          <div className="d-flex flex-column gap-3 mt-4" style={{ maxWidth: "300px" }}>
            {product.stock > 0 && (
              <div>
                <label className="form-label small text-muted mb-1">Ilość</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            )}
            <button
              className="btn btn-primary"
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
            >
              {product.stock > 0 ? "Dodaj do koszyka" : "Produkt niedostępny"}
            </button>

            {user?.role === "admin" && (
              <div className="p-3 bg-light border rounded mt-3">
                <h3 className="h6 text-danger fw-bold mb-2"><i className="bi bi-gear-fill me-1"></i> Panel Administratora</h3>
                <form onSubmit={handleStockSubmit} className="d-flex gap-2">
                  <div className="flex-grow-1">
                    <label className="form-label small text-muted mb-1">Zmień ilość na stanie:</label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      min="0"
                      value={inputStock}
                      onChange={(e) => setInputStock(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-danger btn-sm align-self-end">
                    Zapisz
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
