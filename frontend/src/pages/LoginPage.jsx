import React from "react";

export function AuthPanel({ authMode, setAuthMode, authForm, setAuthForm, submitAuth }) {
  return (
    <div className="p-4 bg-white border rounded">
      <div className="d-flex gap-2 mb-3">
        <button className={`btn btn-sm ${authMode === "login" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setAuthMode("login")}>Logowanie</button>
        <button className={`btn btn-sm ${authMode === "register" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setAuthMode("register")}>Rejestracja</button>
      </div>
      <form onSubmit={submitAuth}>
        {authMode === "register" && (
          <div className="row g-2 mb-2">
            <div className="col"><input className="form-control" placeholder="Imię" value={authForm.firstName} onChange={(e) => setAuthForm({ ...authForm, firstName: e.target.value })} /></div>
            <div className="col"><input className="form-control" placeholder="Nazwisko" value={authForm.lastName} onChange={(e) => setAuthForm({ ...authForm, lastName: e.target.value })} /></div>
          </div>
        )}
        <input className="form-control mb-2" placeholder="Email / Login" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
        <input className="form-control mb-3" type="password" placeholder="Hasło" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
        <button className="btn btn-primary w-100">{authMode === "login" ? "Zaloguj" : "Zarejestruj"}</button>
      </form>
    </div>
  );
}

export function LoginPage({ user, navigate, authMode, setAuthMode, authForm, setAuthForm, submitAuth }) {
  if (user) {
    return (
      <section className="p-4 bg-white border rounded">
        <h1 className="h4 mb-3">Jesteś zalogowany</h1>
        <button className="btn btn-primary" onClick={() => navigate("/moje-konto")}>Przejdź do mojego konta</button>
      </section>
    );
  }

  return (
    <AuthPanel
      authMode={authMode}
      setAuthMode={setAuthMode}
      authForm={authForm}
      setAuthForm={setAuthForm}
      submitAuth={submitAuth}
    />
  );
}
