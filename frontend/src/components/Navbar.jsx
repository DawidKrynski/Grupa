import React from "react";

export function Navbar({ path, cartCount, user, accountMenuOpen, setAccountMenuOpen, navigate, logout }) {
  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
      <div className="container">
        <button className="navbar-brand btn btn-link text-white text-decoration-none fw-semibold p-0" onClick={() => navigate("/")}>VeloShop</button>
        <div className="d-flex align-items-center gap-3 text-white ms-auto">
          <button className={`btn btn-sm ${path === "/zakupy" ? "btn-light" : "btn-outline-light"}`} onClick={() => navigate("/zakupy")}>
            Sklep
          </button>
          <button className={`btn btn-sm ${path === "/naprawy" ? "btn-light" : "btn-outline-light"}`} onClick={() => navigate("/naprawy")}>
            Naprawy rowerowe
          </button>
          <button className={`btn btn-sm position-relative ${path === "/koszyk" ? "btn-light" : "btn-outline-light"}`} onClick={() => navigate("/koszyk")}>
            <i className="bi bi-cart3 me-1"></i> Koszyk
            {cartCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {cartCount}
              </span>
            )}
          </button>
          {!user && (
            <button className={`btn btn-sm ${path === "/logowanie" ? "btn-light" : "btn-outline-light"}`} onClick={() => navigate("/logowanie")}>
              <i className="bi bi-person-circle me-1"></i> Logowanie
            </button>
          )}
          {user ? (
            <div className="position-relative">
              <button className="btn btn-outline-light btn-sm" onClick={() => setAccountMenuOpen(!accountMenuOpen)}>
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
            <span className="small">Niezalogowany</span>
          )}
        </div>
      </div>
    </nav>
  );
}
