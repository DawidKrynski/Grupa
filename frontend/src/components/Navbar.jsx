import React from "react";

export function Navbar({ path, cartCount, user, accountMenuOpen, setAccountMenuOpen, navigate, logout }) {
  function navClass(route) {
    return `btn btn-sm nav-link-btn ${path === route ? "active btn-light" : "btn-outline-light"}`;
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark site-nav">
      <div className="container">
        <button className="navbar-brand btn btn-link text-white text-decoration-none fw-semibold p-0 d-flex align-items-center" onClick={() => navigate("/")}>
          <span className="brand-icon"><i className="bi bi-bicycle"></i></span>
          VeloShop
        </button>
        <div className="d-flex align-items-center gap-3 text-white ms-auto">
          <button className={navClass("/zakupy")} onClick={() => navigate("/zakupy")}>
            <i className="bi bi-shop me-1"></i> Sklep
          </button>
          <button className={navClass("/naprawy")} onClick={() => navigate("/naprawy")}>
            <i className="bi bi-wrench me-1"></i> Naprawy
          </button>
          <button className={`${navClass("/koszyk")} position-relative`} onClick={() => navigate("/koszyk")}>
            <i className="bi bi-cart3 me-1"></i> Koszyk
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning text-dark">
                {cartCount}
              </span>
            )}
          </button>
          {!user && (
            <button className={navClass("/logowanie")} onClick={() => navigate("/logowanie")}>
              <i className="bi bi-person-circle me-1"></i> Logowanie
            </button>
          )}
          {user ? (
            <div className="position-relative">
              <button className="btn btn-outline-light btn-sm nav-link-btn" onClick={() => setAccountMenuOpen(!accountMenuOpen)}>
                <i className="bi bi-person-circle me-1"></i> {user.login} <span className="dropdown-caret">▾</span>
              </button>
              {accountMenuOpen && (
                <div className="account-menu">
                  <button onClick={() => navigate("/moje-konto")}>Moje konto</button>
                  <button onClick={logout}>Wyloguj</button>
                </div>
              )}
            </div>
          ) : (
            <span className="small text-white-50 d-none d-md-inline">Niezalogowany</span>
          )}
        </div>
      </div>
    </nav>
  );
}
