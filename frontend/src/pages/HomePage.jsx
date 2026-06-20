import React from "react";
import { RecommendedProducts } from "../components/RecommendedProducts.jsx";

export function HomePage({ navigate, featuredProducts, featuredLoading, onAddToCart }) {
  return (
    <>
      <section className="hero text-center">
        <h1>VeloShop</h1>
        <p>Twój sklep rowerowy online — przeglądaj katalog, składaj zamówienia i rezerwuj serwis naprawczy w jednym miejscu.</p>
        <div className="hero-actions">
          <button className="btn btn-outline-light btn-lg" onClick={() => navigate("/zakupy")}>
            <i className="bi bi-shop me-2"></i>Przeglądaj sklep
          </button>
          <button className="btn btn-outline-light btn-lg" onClick={() => navigate("/koszyk")}>
            <i className="bi bi-cart3 me-2"></i>Koszyk
          </button>
          <button className="btn btn-outline-light btn-lg" onClick={() => navigate("/naprawy")}>
            <i className="bi bi-wrench me-2"></i>Serwis napraw
          </button>
        </div>
      </section>

      <RecommendedProducts
        products={featuredProducts}
        loading={featuredLoading}
        navigate={navigate}
        onAddToCart={onAddToCart}
      />

      <div className="feature-grid">
        <article className="feature-card">
          <i className="bi bi-bicycle"></i>
          <h3>Szeroki katalog</h3>
          <p>Rowery, części i akcesoria z filtrowaniem po kategorii i cenie.</p>
        </article>
        <article className="feature-card">
          <i className="bi bi-credit-card"></i>
          <h3>Szybkie zamówienia</h3>
          <p>Koszyk, checkout i mockowa płatność w kilku kliknięciach.</p>
        </article>
        <article className="feature-card">
          <i className="bi bi-calendar-check"></i>
          <h3>Serwis rowerowy</h3>
          <p>Rezerwacja naprawy z kalendarzem dostępności i statusem online.</p>
        </article>
      </div>
    </>
  );
}
