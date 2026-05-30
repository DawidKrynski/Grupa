import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";

const USER_API = "http://localhost:4001";
const REPAIR_API = "http://localhost:4005";

const finalStatuses = [
  { value: "completed", label: "Oznacz jako zrealizowane" },
  { value: "cancelled", label: "Oznacz jako anulowane" }
];

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekStartKey(value = new Date()) {
  const date = new Date(value);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const monthDay = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${monthDay}`;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit"
  });
}

function statusLabel(status) {
  const labels = {
    booked: "przyjete",
    accepted: "zaakceptowane",
    in_progress: "w trakcie",
    ready: "gotowe",
    completed: "zrealizowane",
    cancelled: "anulowane"
  };

  return labels[status] || status;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("veloshopToken") || "");
  const [user, setUser] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [services, setServices] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [repairs, setRepairs] = useState([]);
  const [estimate, setEstimate] = useState(null);
  const [repairForm, setRepairForm] = useState({
    bikeDescription: "",
    issueDescription: "",
    repairServiceId: "",
    dropOffDate: todayKey()
  });

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }), [token]);

  useEffect(() => {
    loadPublicData();
  }, []);

  useEffect(() => {
    if (token) {
      loadProfile(token);
    }
  }, [token]);

  useEffect(() => {
    if (repairForm.repairServiceId && repairForm.dropOffDate) {
      loadEstimate();
    } else {
      setEstimate(null);
    }
  }, [repairForm.repairServiceId, repairForm.dropOffDate]);

  async function request(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Blad serwera");
    }

    return data;
  }

  async function loadPublicData() {
    const [nextServices, nextCalendar] = await Promise.all([
      request(`${REPAIR_API}/repair-services`),
      request(`${REPAIR_API}/repair-calendar?from=${weekStartKey()}&days=28`)
    ]);

    setServices(nextServices);
    setCalendar(nextCalendar);
  }

  async function loadProfile(nextToken) {
    try {
      const profile = await request(`${USER_API}/users/me`, {
        headers: { Authorization: `Bearer ${nextToken}` }
      });
      setUser(profile);
      await loadRepairs(nextToken);
    } catch {
      logout();
    }
  }

  async function loadRepairs(nextToken = token) {
    const data = await request(`${REPAIR_API}/repairs`, {
      headers: { Authorization: `Bearer ${nextToken}` }
    });
    setRepairs(data);
  }

  async function loadEstimate() {
    const data = await request(`${REPAIR_API}/repair-estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repairServiceId: Number(repairForm.repairServiceId),
        dropOffDate: repairForm.dropOffDate
      })
    });

    setEstimate(data);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setMessage("");

    try {
      const path = authMode === "login" ? "/auth/login" : "/auth/register";
      const body = authMode === "login"
        ? { login: authForm.email, password: authForm.password }
        : authForm;
      const data = await request(`${USER_API}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      localStorage.setItem("veloshopToken", data.token);
      setToken(data.token);
      setUser(data.user);
      setMessage("Zalogowano.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function submitRepair(event) {
    event.preventDefault();
    setMessage("");

    try {
      const data = await request(`${REPAIR_API}/repairs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bikeDescription: repairForm.bikeDescription,
          issueDescription: repairForm.issueDescription,
          repairServiceId: Number(repairForm.repairServiceId),
          dropOffDate: repairForm.dropOffDate
        })
      });

      setRepairs([data, ...repairs]);
      setRepairForm({ bikeDescription: "", issueDescription: "", repairServiceId: "", dropOffDate: todayKey() });
      setEstimate(null);
      setMessage("Zgloszenie naprawy zapisane.");
      await loadPublicData();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function changeStatus(repair, status) {
    const updated = await request(`${REPAIR_API}/repairs/${repair.id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status })
    });

    setRepairs(repairs.map((item) => item.id === updated.id ? updated : item));
    await loadPublicData();
  }

  async function clearHistory() {
    await request(`${REPAIR_API}/repairs`, {
      method: "DELETE",
      headers
    });

    setRepairs([]);
    setMessage("Historia napraw zostala wyczyszczona.");
    await loadPublicData();
  }

  function logout() {
    localStorage.removeItem("veloshopToken");
    setToken("");
    setUser(null);
    setRepairs([]);
    setAccountMenuOpen(false);
    navigate("/");
  }

  function navigate(nextPath) {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
    setAccountMenuOpen(false);
  }

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const validPath = path === "/" || path === "/naprawy" || path === "/logowanie" || path === "/moje-konto";

  return (
    <div className="app-shell">
      <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
        <div className="container">
          <button className="navbar-brand btn btn-link text-white text-decoration-none fw-semibold p-0" onClick={() => navigate("/")}>VeloShop</button>
          <div className="d-flex align-items-center gap-3 text-white ms-auto">
            <button className={`btn btn-sm ${path === "/naprawy" ? "btn-light" : "btn-outline-light"}`} onClick={() => navigate("/naprawy")}>Naprawy rowerowe</button>
            {!user && <button className={`btn btn-sm ${path === "/logowanie" ? "btn-light" : "btn-outline-light"}`} onClick={() => navigate("/logowanie")}>Logowanie</button>}
            {user ? (
              <div className="position-relative">
                <button className="btn btn-outline-light btn-sm" onClick={() => setAccountMenuOpen(!accountMenuOpen)}>
                  {user.login} <span className="dropdown-caret" aria-hidden="true">▾</span>
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

      <main className="container py-4">
        {message && <div className="alert alert-info py-2">{message}</div>}

        {!validPath && <NotFound navigate={navigate} />}
        {path === "/" && <HomePage navigate={navigate} />}
        {path === "/logowanie" && (
          <div className="row justify-content-center">
            <div className="col-lg-5">
              {user ? (
                <section className="p-4 bg-white border rounded">
                  <h1 className="h4 mb-3">Jestes zalogowany</h1>
                  <button className="btn btn-primary" onClick={() => navigate("/moje-konto")}>Przejdz do mojego konta</button>
                </section>
              ) : (
                <AuthPanel
                  authMode={authMode}
                  setAuthMode={setAuthMode}
                  authForm={authForm}
                  setAuthForm={setAuthForm}
                  submitAuth={submitAuth}
                />
              )}
            </div>
          </div>
        )}
        {path === "/moje-konto" && (
          user ? (
            <AccountPage
              user={user}
              repairs={repairs}
              changeStatus={changeStatus}
              clearHistory={clearHistory}
            />
          ) : (
            <section className="p-4 bg-white border rounded">
              <h1 className="h4 mb-3">Moje konto</h1>
              <p className="text-secondary">Zaloguj sie, zeby zobaczyc dane konta i historie napraw.</p>
              <button className="btn btn-primary" onClick={() => navigate("/logowanie")}>Logowanie</button>
            </section>
          )
        )}
        {path === "/naprawy" && (
          <>
        <section className="row g-4 mb-4">
          <div className="col-12">
            <div className="p-4 bg-white border rounded h-100">
              <h1 className="h3 mb-3">Rezerwacja napraw rowerow</h1>
              <p className="mb-0 text-secondary">
                Tutaj mozesz sprawdzic mozliwe terminy naprawy swojego roweru, kalendarz terminow pokazuje dni, w ktorych rower mozna oddac do naprawy, a czas pracy zalezy od liczby zgloszen i jest szacowany na podstawie deklarowanej naprawy.
              </p>
            </div>
          </div>
        </section>

        <section className="row g-4 mb-4">
          <div className="col-lg-7">
            <RepairCalendar
              calendar={calendar}
              selectedDate={repairForm.dropOffDate}
              setSelectedDate={(date) => setRepairForm({ ...repairForm, dropOffDate: date })}
              user={user}
            />
          </div>
          <div className="col-lg-5">
            <RepairBooking
              user={user}
              services={services}
              repairForm={repairForm}
              setRepairForm={setRepairForm}
              estimate={estimate}
              submitRepair={submitRepair}
            />
          </div>
        </section>

          </>
        )}
      </main>

      <footer className="border-top bg-white py-3">
        <div className="container small text-secondary">
          TODO: Dodać footer content
        </div>
      </footer>
    </div>
  );
}

function HomePage({ navigate }) {
  return (
    <section className="p-4 bg-white border rounded">
      <h1 className="h3 mb-3">VeloShop</h1>
      <p className="text-secondary mb-4">
        TODO: Dodać homepage content
      </p>
      <button className="btn btn-primary" onClick={() => navigate("/naprawy")}>Przejdz do napraw rowerowych</button>
    </section>
  );
}

function NotFound({ navigate }) {
  return (
    <section className="p-4 bg-white border rounded text-center">
      <h1 className="h3 mb-3">404</h1>
      <p className="text-secondary">Nie znaleziono strony.</p>
      <button className="btn btn-primary" onClick={() => navigate("/")}>Powrot do strony glownej</button>
    </section>
  );
}

function AuthPanel({ authMode, setAuthMode, authForm, setAuthForm, submitAuth }) {
  return (
    <div className="p-4 bg-white border rounded h-100">
      <div className="d-flex gap-2 mb-3">
        <button className={`btn btn-sm ${authMode === "login" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setAuthMode("login")}>Logowanie</button>
        <button className={`btn btn-sm ${authMode === "register" ? "btn-dark" : "btn-outline-dark"}`} onClick={() => setAuthMode("register")}>Rejestracja</button>
      </div>
      <form onSubmit={submitAuth}>
        {authMode === "register" && (
          <div className="row g-2 mb-2">
            <div className="col">
              <input className="form-control" placeholder="Imie" value={authForm.firstName} onChange={(event) => setAuthForm({ ...authForm, firstName: event.target.value })} />
            </div>
            <div className="col">
              <input className="form-control" placeholder="Nazwisko" value={authForm.lastName} onChange={(event) => setAuthForm({ ...authForm, lastName: event.target.value })} />
            </div>
          </div>
        )}
        <input className="form-control mb-2" placeholder={authMode === "login" ? "Login albo email" : "Email"} value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} />
        <input className="form-control mb-3" type="password" placeholder="Haslo" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} />
        <button className="btn btn-primary w-100">{authMode === "login" ? "Zaloguj" : "Utworz konto"}</button>
        <div className="small text-secondary mt-3">Demo: user/user, admin/admin</div>
      </form>
    </div>
  );
}

function AccountPage({ user, repairs, changeStatus, clearHistory }) {
  return (
    <div className="row g-4">
      <div className="col-lg-4">
        <section className="p-4 bg-white border rounded h-100">
          <h1 className="h4 mb-3">Moje konto</h1>
          <dl className="mb-0">
            <dt>Imie i nazwisko</dt>
            <dd>{user.firstName} {user.lastName}</dd>
            <dt>Email</dt>
            <dd>{user.email}</dd>
            <dt>Login</dt>
            <dd>{user.login}</dd>
            <dt>Typ konta</dt>
            <dd>{user.role === "admin" ? "Wlasciciel" : "Klient"}</dd>
          </dl>
        </section>
      </div>
      <div className="col-lg-8">
        <RepairHistory
          user={user}
          repairs={repairs}
          changeStatus={changeStatus}
          clearHistory={clearHistory}
        />
      </div>
    </div>
  );
}

function RepairCalendar({ calendar, selectedDate, setSelectedDate, user }) {
  const weekdays = ["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Nd"];

  return (
    <div className="p-4 bg-white border rounded h-100">
      <h2 className="h5 mb-3">Kalendarz terminow</h2>
      <div className="calendar-weekdays">
        {weekdays.map((day) => <div key={day}>{day}</div>)}
      </div>
      <div className="calendar-grid">
        {calendar.map((day) => {
          const availability = day.freeHours === 8 ? "free" : day.freeHours > 0 ? "partial" : "full";
          const disabled = availability === "full";
          return (
            <button
              className={`calendar-day ${availability} ${selectedDate === day.date ? "selected" : ""}`}
              disabled={disabled}
              key={day.date}
              onClick={() => setSelectedDate(day.date)}
            >
              <span>{formatDate(day.date)}</span>
              <strong>{availability === "free" ? "wolny" : availability === "partial" ? "czesciowo zajety" : "brak terminu"}</strong>
              {user?.role === "admin" && <small>{day.freeHours}h wolne / {day.bookedHours}h zajete</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RepairBooking({ user, services, repairForm, setRepairForm, estimate, submitRepair }) {
  return (
    <div className="p-4 bg-white border rounded h-100">
      <h2 className="h5 mb-3">Zlecenie naprawy</h2>
      {!user && <div className="alert alert-warning py-2">Zaloguj sie, zeby zlozyc zlecenie.</div>}
      <form onSubmit={submitRepair}>
        <select className="form-select mb-2" value={repairForm.repairServiceId} onChange={(event) => setRepairForm({ ...repairForm, repairServiceId: event.target.value })}>
          <option value="">Wybierz rodzaj naprawy</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {service.durationHours}h - {service.price} zl
            </option>
          ))}
        </select>
        <div className="form-control mb-2 bg-light">Dzien oddania: {repairForm.dropOffDate}</div>
        <input className="form-control mb-2" placeholder="Opis roweru" value={repairForm.bikeDescription} onChange={(event) => setRepairForm({ ...repairForm, bikeDescription: event.target.value })} />
        <textarea className="form-control mb-3" rows="3" placeholder="Opis usterki" value={repairForm.issueDescription} onChange={(event) => setRepairForm({ ...repairForm, issueDescription: event.target.value })} />
        {estimate && (
          <div className="alert alert-light border py-2">
            <div>Oddanie: {repairForm.dropOffDate}</div>
            <div>Szacowany odbior: {estimate.readyDate}</div>
            <div>Czas pracy: {estimate.durationHours}h</div>
          </div>
        )}
        <button className="btn btn-primary w-100" disabled={!user}>Zloz zlecenie</button>
      </form>
    </div>
  );
}

function RepairHistory({ user, repairs, changeStatus, clearHistory }) {
  return (
    <section className="p-4 bg-white border rounded">
      <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">{user?.role === "admin" ? "Panel napraw" : "Historia moich napraw"}</h2>
        {user?.role === "admin" && (
          <button className="btn btn-outline-danger btn-sm" onClick={clearHistory}>Wyczysc historie napraw</button>
        )}
      </div>
      {!user && <p className="text-secondary mb-0">Historia jest dostepna po zalogowaniu.</p>}
      {user && repairs.length === 0 && <p className="text-secondary mb-0">Brak zlecen.</p>}
      <div className="row g-3">
        {repairs.map((repair) => (
          <div className="col-lg-6" key={repair.id}>
            <div className="border rounded p-3 h-100">
              <div className="d-flex justify-content-between gap-2 mb-2">
                <strong>{repair.bikeDescription}</strong>
                <span className="badge text-bg-secondary">{statusLabel(repair.status)}</span>
              </div>
              <div className="small text-secondary">{repair.RepairService?.name} | {repair.plannedHours}h</div>
              <div className="small text-secondary">Oddanie: {repair.dropOffDate} | Odbior: {repair.readyDate}</div>
              <p className="small mt-2 mb-3">{repair.issueDescription}</p>
              {user?.role === "admin" && !["completed", "cancelled"].includes(repair.status) && (
                <div className="d-flex gap-2">
                  {finalStatuses.map((status) => (
                    <button className="btn btn-sm btn-outline-primary" key={status.value} onClick={() => changeStatus(repair, status.value)}>
                      {status.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
