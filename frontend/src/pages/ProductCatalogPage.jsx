import React, { useState } from "react";

export function ProductCatalogPage({ products, categories, filters, setFilters, loading, navigate, user, onAddProduct, onDeleteProduct, onAddToCart }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", description: "", price: "", imageUrl: "", category: "", stock: "0"
  });

  function handleSubmit(e) {
    e.preventDefault();
    onAddProduct(newProduct);
    setNewProduct({ name: "", description: "", price: "", imageUrl: "", category: "", stock: "0" });
    setShowAddForm(false);
  }

  return (
    <section className="p-4 bg-white border rounded">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h3 mb-0">Katalog Produktów</h1>

        {user?.role === "admin" && (
          <button
            className={`btn btn-sm ${showAddForm ? "btn-secondary" : "btn-danger"}`}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Anuluj" : <><i className="bi bi-plus-circle me-1"></i> Dodaj nowy produkt</>}
          </button>
        )}
      </div>

      {user?.role === "admin" && showAddForm && (
        <form onSubmit={handleSubmit} className="p-3 bg-light border rounded mb-4 row g-2">
          <h5 className="h6 text-danger fw-bold mb-2 col-12">Nowy produkt</h5>
          <div className="col-md-4">
            <input type="text" className="form-control form-control-sm" placeholder="Nazwa produktu" required value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
          </div>
          <div className="col-md-4">
            <input type="text" className="form-control form-control-sm" placeholder="Kategoria (np. Rowery, Akcesoria)" required value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })} />
          </div>
          <div className="col-md-2">
            <input type="number" step="0.01" className="form-control form-control-sm" placeholder="Cena (PLN)" required value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
          </div>
          <div className="col-md-2">
            <input type="number" className="form-control form-control-sm" placeholder="Ilość na stanie" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} />
          </div>
          <div className="col-md-8">
            <input type="text" className="form-control form-control-sm" placeholder="URL do zdjęcia (opcjonalnie)" value={newProduct.imageUrl} onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })} />
          </div>
          <div className="col-md-4">
            <button type="submit" className="btn btn-success btn-sm w-100">Zapisz produkt w sklepie</button>
          </div>
          <div className="col-12">
            <textarea className="form-control form-control-sm" rows="1" placeholder="Opis produktu" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}></textarea>
          </div>
        </form>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <input type="text" className="form-control" placeholder="Szukaj produktu..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        </div>
        <div className="col-md-6">
          <select className="form-select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">Wszystkie kategorie</option>
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="text-center py-4">Ładowanie...</div> : (
        <div className="row g-4">
          {products.map((product) => (
            <div className="col-sm-6 col-md-4 col-lg-3" key={product.id}>
              <div className="card h-100 border text-center">
                <img src={product.imageUrl} className="card-img-top" alt={product.name} style={{ height: "140px", objectFit: "cover" }} />
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title h6 text-truncate">{product.name}</h5>
                  <p className="card-text fw-bold text-primary mb-1">{product.price.toFixed(2)} PLN</p>
                  <p className="mb-2 text-muted" style={{ fontSize: "12px" }}>Dostępność: {product.stock > 0 ? `${product.stock} szt.` : "Brak na stanie"}</p>

                  <div className="d-flex gap-1 mt-auto justify-content-center">
                    <button className="btn btn-sm btn-outline-dark flex-grow-1" onClick={() => navigate(`/produkt/${product.id}`)}>Szczegóły</button>

                    {product.stock > 0 && (
                      <button
                        className="btn btn-sm btn-primary"
                        title="Dodaj do koszyka"
                        onClick={() => onAddToCart(product)}
                      >
                        <i className="bi bi-cart-plus"></i>
                      </button>
                    )}

                    {user?.role === "admin" && (
                      <button
                        className="btn btn-sm btn-outline-danger"
                        title="Usuń produkt"
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
