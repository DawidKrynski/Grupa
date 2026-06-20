import React from "react";

export function RecommendedProducts({ products, loading, navigate, onAddToCart }) {
  return (
    <section className="recommended-section page-panel">
      <div className="section-head">
        <div>
          <span className="recommended-label">POLECAMY</span>
          <h2 className="h4 mb-0">Polecane produkty</h2>
        </div>
        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => navigate("/zakupy")}>
          Zobacz cały katalog
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-muted">
          <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
          Ładowanie produktów...
        </div>
      ) : products.length === 0 ? (
        <p className="text-muted mb-0">Brak produktów do wyświetlenia.</p>
      ) : (
        <div className="recommended-grid">
          {products.map((product) => (
            <article className="recommended-card" key={product.id}>
              <div className="recommended-card-image">
                <span className="recommended-badge">POLECAMY</span>
                <img src={product.imageUrl} alt={product.name} loading="lazy" />
              </div>
              <div className="recommended-card-body">
                <span className="recommended-category">{product.category}</span>
                <h3 className="recommended-name">{product.name}</h3>
                <p className="recommended-price">{product.price.toFixed(2)} PLN</p>
                <div className="recommended-actions">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary flex-grow-1"
                    onClick={() => navigate(`/produkt/${product.id}`)}
                  >
                    Szczegóły
                  </button>
                  {product.stock > 0 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      title="Dodaj do koszyka"
                      onClick={() => onAddToCart(product)}
                    >
                      <i className="bi bi-cart-plus"></i>
                    </button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
