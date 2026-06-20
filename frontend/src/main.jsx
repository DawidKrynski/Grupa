import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";

const USER_API = "http://localhost:4001";
const REPAIR_API = "http://localhost:4005";
const PRODUCT_API = "http://localhost:3002";
const ORDER_API = "http://localhost:4003";
const PAYMENT_API = "http://localhost:4006";

const finalStatuses = [
  { value: "completed", label: "Oznacz jako zrealizowane" },
  { value: "cancelled", label: "Oznacz jako anulowane" }
];

const orderAdminStatuses = [
  { value: "shipped", label: "Oznacz jako wysłane" },
  { value: "completed", label: "Oznacz jako zrealizowane" },
  { value: "cancelled", label: "Oznacz jako anulowane" }
];

function loadCartFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("veloshopCart") || "[]");
  } catch {
    return [];
  }
}

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit"
  });
}

function statusLabel(status) {
  const labels = {
    booked: "przyjęte",
    accepted: "zaakceptowane",
    in_progress: "w trakcie",
    ready: "gotowe",
    completed: "zrealizowane",
    cancelled: "anulowane"
  };

  return labels[status] || status;
}

function orderStatusLabel(status) {
  const labels = {
    pending: "oczekujące",
    paid: "opłacone",
    failed: "płatność nieudana",
    shipped: "wysłane",
    completed: "zrealizowane",
    cancelled: "anulowane"
  };

  return labels[status] || status;
}

function orderStatusBadgeClass(status) {
  if (["paid", "shipped", "completed"].includes(status)) return "bg-success";
  if (status === "failed") return "bg-danger";
  if (status === "cancelled") return "bg-dark";
  return "bg-secondary";
}

function paymentMethodLabel(method) {
  const labels = { card: "Karta płatnicza", blik: "BLIK" };
  return labels[method] || method;
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

  const [pendingPayment, setPendingPayment] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productFilters, setProductFilters] = useState({ search: "", category: "" });

  const [cart, setCart] = useState(loadCartFromStorage);
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ deliveryAddress: "", paymentMethod: "card" });
  const [orderLoading, setOrderLoading] = useState(false);

  const headers = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  }), [token]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  useEffect(() => {
    localStorage.setItem("veloshopCart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    loadPublicData();
    loadCategories();
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

  useEffect(() => {
    if (path === "/zakupy") loadProducts();
  }, [path, productFilters]);

  useEffect(() => {
    if (path === "/koszyk" && cart.length > 0) {
      syncCartStock();
    }
  }, [path]);

  useEffect(() => {
    if (path.startsWith("/produkt/")) {
      const productId = path.split("/")[2];
      if (productId) loadSingleProduct(productId);
    }
  }, [path]);

  useEffect(() => {
    if (path.startsWith("/zamowienie/")) {
      const orderId = path.split("/")[2];
      if (orderId) loadSingleOrder(orderId);
    } else {
      setSelectedOrder(null);
    }
  }, [path, token]);

  async function request(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || "Błąd serwera");
    }

    return data;
  }

  async function loadPublicData() {
    const [nextServices, nextCalendar] = await Promise.all([
      request(`${REPAIR_API}/repair-services`),
      request(`${REPAIR_API}/repair-calendar?from=${todayKey()}&days=21`)
    ]);

    setServices(nextServices);
    setCalendar(nextCalendar);
  }

  async function loadCategories() {
    try {
      const data = await request(`${PRODUCT_API}/products/categories`);
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadProducts() {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams();
      if (productFilters.search) params.append("search", productFilters.search);
      if (productFilters.category) params.append("category", productFilters.category);
      const data = await request(`${PRODUCT_API}/products?${params.toString()}`);
      setProducts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  }

  async function loadSingleProduct(id) {
    try {
      const data = await request(`${PRODUCT_API}/products/${id}`);
      setSelectedProduct(data);
    } catch (err) {
      setSelectedProduct(null);
    }
  }

  async function loadProfile(nextToken) {
    try {
      const profile = await request(`${USER_API}/users/me`, {
        headers: { Authorization: `Bearer ${nextToken}` }
      });
      setUser(profile);
      await Promise.all([
        loadRepairs(nextToken),
        loadOrders(nextToken)
      ]);
    } catch {
      logout();
    }
  }

  async function loadOrders(nextToken = token) {
    const data = await request(`${ORDER_API}/orders`, {
      headers: { Authorization: `Bearer ${nextToken}` }
    });
    setOrders(data);
  }

  async function loadSingleOrder(id) {
    if (!token) {
      setSelectedOrder(null);
      return;
    }

    setOrderDetailsLoading(true);

    try {
      const data = await request(`${ORDER_API}/orders/${id}`, { headers });
      setSelectedOrder(data);
    } catch {
      setSelectedOrder(null);
    } finally {
      setOrderDetailsLoading(false);
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
      const authPath = authMode === "login" ? "/auth/login" : "/auth/register";
      const body = authMode === "login" ? { login: authForm.email, password: authForm.password } : authForm;
      const data = await request(`${USER_API}${authPath}`, {
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

  function addToCart(product, quantity = 1) {
    if (product.stock <= 0) {
      setMessage("Błąd: Produkt jest niedostępny.");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);

      if (existing) {
        const nextQuantity = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((item) => item.productId === product.id
          ? { ...item, stock: product.stock, price: product.price, quantity: nextQuantity }
          : item);
      }

      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        quantity: Math.min(quantity, product.stock)
      }];
    });
    setMessage(`Dodano "${product.name}" do koszyka.`);
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    if (!window.confirm("Czy na pewno chcesz wyczyścić koszyk?")) {
      return;
    }

    setCart([]);
    setMessage("Koszyk został wyczyszczony.");
  }

  async function syncCartStock() {
    if (cart.length === 0) {
      return;
    }

    try {
      const products = await Promise.all(
        cart.map((item) => request(`${PRODUCT_API}/products/${item.productId}`).catch(() => null))
      );

      const next = cart.flatMap((item, index) => {
        const product = products[index];

        if (!product || product.stock <= 0) {
          return [];
        }

        return [{
          ...item,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          quantity: Math.min(item.quantity, product.stock)
        }];
      });

      if (next.length < cart.length) {
        setMessage("Usunięto z koszyka produkty, których już nie ma na stanie.");
      }

      setCart(next);
    } catch (error) {
      console.error(error);
    }
  }

  function updateCartQuantity(productId, quantity) {
    setCart((prev) => prev.map((item) => {
      if (item.productId !== productId) {
        return item;
      }

      const nextQuantity = Math.max(1, Math.min(Number(quantity), item.stock));
      return { ...item, quantity: nextQuantity };
    }));
  }

  async function submitOrder(event) {
    event.preventDefault();
    setMessage("");

    if (!user) {
      setMessage("Zaloguj się, aby złożyć zamówienie.");
      navigate("/logowanie");
      return;
    }

    if (cart.length === 0) {
      setMessage("Błąd: Koszyk jest pusty.");
      return;
    }

    if (!checkoutForm.deliveryAddress.trim()) {
      setMessage("Błąd: Podaj adres dostawy.");
      return;
    }

    setOrderLoading(true);

    try {
      const order = await request(`${ORDER_API}/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          deliveryAddress: checkoutForm.deliveryAddress.trim(),
          paymentMethod: checkoutForm.paymentMethod
        })
      });

      if (order.status === "paid") {
        setCart([]);
        setCheckoutForm({ deliveryAddress: "", paymentMethod: "card" });
        setOrders([order, ...orders]);
        setMessage("Zamówienie opłacone i złożone pomyślnie!");
        navigate(`/zamowienie/${order.id}`);
      } else {
        setOrders([order, ...orders]);
        setMessage(`Błąd płatności: ${order.paymentMessage || "Płatność nieudana."}`);
        navigate(`/zamowienie/${order.id}`);
      }

      if (path === "/zakupy") {
        await loadProducts();
      }
    } catch (error) {
      setMessage(`Błąd: ${error.message}`);
    } finally {
      setOrderLoading(false);
    }
  }

  async function changeOrderStatus(order, status) {
    const updated = await request(`${ORDER_API}/orders/${order.id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status })
    });

    setOrders(orders.map((item) => item.id === updated.id ? updated : item));
    if (selectedOrder?.id === updated.id) {
      setSelectedOrder(updated);
    }
    setMessage(`Status zamówienia #${updated.id} zmieniony na: ${orderStatusLabel(updated.status)}.`);
  }

  async function retryOrderPayment(order) {
    setOrderLoading(true);

    try {
      const updated = await request(`${ORDER_API}/orders/${order.id}/retry-payment`, {
        method: "POST",
        headers
      });

      setOrders(orders.map((item) => item.id === updated.id ? updated : item));
      setSelectedOrder(updated);

      if (updated.status === "paid") {
        setCart([]);
        setMessage("Płatność zrealizowana pomyślnie!");
      } else {
        setMessage(`Błąd płatności: ${updated.paymentMessage || "Płatność nieudana."}`);
      }
    } catch (error) {
      setMessage(`Błąd: ${error.message}`);
    } finally {
      setOrderLoading(false);
    }
  }

  function handleGoToPayment(event) {
    event.preventDefault();
    setMessage("");

    if (!repairForm.repairServiceId || !repairForm.bikeDescription || !repairForm.issueDescription) {
      setMessage("Błąd: Proszę uzupełnić wszystkie pola serwisu.");
      return;
    }

    const selectedService = services.find(s => s.id === Number(repairForm.repairServiceId));

    setPendingPayment({
      form: { ...repairForm },
      serviceName: selectedService?.name || "Serwis rowerowy",
      price: selectedService?.price || 0
    });

    navigate("/platnosc");
  }

  async function executePaymentAndBooking() {
    if (!pendingPayment) return;
    setPaymentLoading(true);
    setMessage("");

    try {
      const payRes = await fetch(`${PAYMENT_API}/payments/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: pendingPayment.price, repairId: Date.now() })
      });
      const payData = await payRes.json().catch(() => null);

      if (!payRes.ok || !payData?.success) {
        throw new Error(payData?.message || "Transakcja została odrzucona przez bank.");
      }

      const data = await request(`${REPAIR_API}/repairs`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          bikeDescription: pendingPayment.form.bikeDescription,
          issueDescription: pendingPayment.form.issueDescription,
          repairServiceId: Number(pendingPayment.form.repairServiceId),
          dropOffDate: pendingPayment.form.dropOffDate
        })
      });

      setRepairs([data, ...repairs]);
      setRepairForm({ bikeDescription: "", issueDescription: "", repairServiceId: "", dropOffDate: todayKey() });
      setEstimate(null);
      setPendingPayment(null);
      setMessage("Płatność zakończona sukcesem! Zlecenie zostało pomyślnie opłacone i zarejestrowane.");
      navigate("/moje-konto");
      await loadPublicData();
    } catch (error) {
      setMessage(`Błąd płatności: ${error.message}`);
    } finally {
      setPaymentLoading(false);
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
    setMessage("Historia napraw została wyczyszczona.");
    await loadPublicData();
  }

  function logout() {
    localStorage.removeItem("veloshopToken");
    setToken("");
    setUser(null);
    setRepairs([]);
    setOrders([]);
    setAccountMenuOpen(false);
    navigate("/");
  }

  function navigate(nextPath) {
    window.history.pushState({}, "", nextPath);
    setPath(nextPath);
    setAccountMenuOpen(false);
  }

  async function changeProductStock(productId, newStock) {
    try {
      const updatedProduct = await request(`${PRODUCT_API}/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: Number(newStock) })
      });

      setSelectedProduct(updatedProduct);
      setMessage("Stan magazynowy został pomyślnie zaktualizowany.");
    } catch (error) {
      setMessage(`Błąd aktualizacji zapasu: ${error.message}`);
    }
  }

  async function handleAddProduct(productData) {
    try {
      const newProduct = await request(`${PRODUCT_API}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData)
      });

      setProducts([newProduct, ...products]);
      setMessage(`Pomyślnie dodano produkt: ${newProduct.name}`);

      await loadCategories();
    } catch (error) {
      setMessage(`Błąd dodawania produktu: ${error.message}`);
    }
  }

  async function handleIdDeleteProduct(productId) {
    if (!window.confirm("Czy na pewno chcesz usunąć ten produkt ze sklepu?")) return;

    try {
      await request(`${PRODUCT_API}/products/${productId}`, {
        method: "DELETE"
      });

      setProducts(products.filter(p => p.id !== productId));
      setMessage("Produkt został pomyślnie usunięty.");
    } catch (error) {
      setMessage(`Błąd usuwania produktu: ${error.message}`);
    }
  }

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const isProductDetailsPath = path.startsWith("/produkt/");
  const isOrderDetailsPath = path.startsWith("/zamowienie/");
  const validPath = path === "/" || path === "/naprawy" || path === "/logowanie" || path === "/moje-konto" || path === "/zakupy" || path === "/koszyk" || path === "/platnosc" || isProductDetailsPath || isOrderDetailsPath;

  return (
      <div className="app-shell">
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

        <main className="container py-4">
          {message && (
              <div className={`alert ${message.startsWith("Błąd") ? "alert-danger" : "alert-success"} py-2`}>
                {message}
              </div>
          )}

          {!validPath && <NotFound navigate={navigate} />}
          {path === "/" && <HomePage navigate={navigate} />}

          {path === "/zakupy" && (
              <ProductCatalogPage
                  products={products}
                  categories={categories}
                  filters={productFilters}
                  setFilters={setProductFilters}
                  loading={productsLoading}
                  navigate={navigate}
                  user={user}
                  onAddProduct={handleAddProduct}
                  onDeleteProduct={handleIdDeleteProduct}
                  onAddToCart={addToCart}
              />
          )}

          {isProductDetailsPath && (
              <ProductDetailsPage
                  product={selectedProduct}
                  user={user}
                  onChangeStock={changeProductStock}
                  onAddToCart={addToCart}
                  navigate={navigate}
              />
          )}

          {isOrderDetailsPath && (
              user ? (
                  <OrderDetailsPage
                      order={selectedOrder}
                      loading={orderDetailsLoading || orderLoading}
                      user={user}
                      navigate={navigate}
                      changeOrderStatus={changeOrderStatus}
                      onRetryPayment={retryOrderPayment}
                  />
              ) : (
                  <section className="p-4 bg-white border rounded text-center">
                    <h1 className="h4 mb-3">Szczegóły zamówienia</h1>
                    <p className="text-secondary mb-3">Zaloguj się, aby zobaczyć zamówienie.</p>
                    <button className="btn btn-primary" onClick={() => navigate("/logowanie")}>Logowanie</button>
                  </section>
              )
          )}

          {path === "/koszyk" && (
              <CartPage
                  cart={cart}
                  cartTotal={cartTotal}
                  user={user}
                  checkoutForm={checkoutForm}
                  setCheckoutForm={setCheckoutForm}
                  onRemove={removeFromCart}
                  onUpdateQuantity={updateCartQuantity}
                  onClearCart={clearCart}
                  onSubmitOrder={submitOrder}
                  loading={orderLoading}
                  navigate={navigate}
              />
          )}

          {path === "/platnosc" && (
              <PaymentGatePage
                  pendingPayment={pendingPayment}
                  loading={paymentLoading}
                  onPay={executePaymentAndBooking}
                  onCancel={() => { setPendingPayment(null); navigate("/naprawy"); }}
              />
          )}

          {path === "/logowanie" && (
              <div className="row justify-content-center">
                <div className="col-lg-5">
                  {user ? (
                      <section className="p-4 bg-white border rounded">
                        <h1 className="h4 mb-3">Jesteś zalogowany</h1>
                        <button className="btn btn-primary" onClick={() => navigate("/moje-konto")}>Przejdź do mojego konta</button>
                      </section>
                  ) : (
                      <AuthPanel authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} submitAuth={submitAuth} />
                  )}
                </div>
              </div>
          )}

          {path === "/moje-konto" && (
              user ? (
                  <AccountPage
                      user={user}
                      repairs={repairs}
                      orders={orders}
                      changeStatus={changeStatus}
                      changeOrderStatus={changeOrderStatus}
                      clearHistory={clearHistory}
                      navigate={navigate}
                  />
              ) : (
                  <section className="p-4 bg-white border rounded">
                    <h1 className="h4 mb-3">Moje konto</h1>
                    <button className="btn btn-primary" onClick={() => navigate("/logowanie")}>Logowanie</button>
                  </section>
              )
          )}

          {path === "/naprawy" && (
              <>
                <section className="row g-4 mb-4">
                  <div className="col-12">
                    <div className="p-4 bg-white border rounded">
                      <h1 className="h3 mb-2">Rezerwacja napraw rowerów</h1>
                      <p className="mb-0 text-secondary">Zgłoś usterkę, wybierz wolny termin z kalendarza i przejdź do bezpiecznej płatności online.</p>
                    </div>
                  </div>
                </section>

                <section className="row g-4 mb-4">
                  <div className="col-lg-7">
                    <RepairCalendar calendar={calendar} selectedDate={repairForm.dropOffDate} setSelectedDate={(date) => setRepairForm({ ...repairForm, dropOffDate: date })} user={user} />
                  </div>
                  <div className="col-lg-5">
                    <RepairBooking user={user} services={services} repairForm={repairForm} setRepairForm={setRepairForm} estimate={estimate} submitRepair={handleGoToPayment} />
                  </div>
                </section>
              </>
          )}
        </main>

        <footer className="border-top bg-white py-3">
          <div className="container small text-secondary">© 2026 VeloShop</div>
        </footer>
      </div>
  );
}

function PaymentGatePage({ pendingPayment, loading, onPay, onCancel }) {
  if (!pendingPayment) {
    return (
        <div className="p-4 bg-white border rounded text-center">
          <p className="text-secondary">Brak aktywnej sesji płatności.</p>
          <button className="btn btn-dark btn-sm" onClick={onCancel}>Wróć do serwisu</button>
        </div>
    );
  }

  return (
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow-sm border rounded-3 overflow-hidden">
            <div className="bg-primary text-white p-4 text-center">
              <h2 className="h4 mb-1">VPay Secure</h2>
              <small className="opacity-75">Bezpieczna autoryzacja transakcji</small>
            </div>
            <div className="card-body p-4 bg-white">
              <h3 className="h6 text-uppercase text-muted mb-3">Podsumowanie zamówienia</h3>
              <div className="d-flex justify-content-between border-bottom pb-2 mb-3">
                <span>{pendingPayment.serviceName} ({pendingPayment.form.bikeDescription})</span>
                <span className="fw-semibold">{pendingPayment.price.toFixed(2)} zł</span>
              </div>

              <div className="bg-light p-3 rounded mb-4 text-center">
                <span className="small text-secondary d-block">Do zapłaty:</span>
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
                      <>
                        Autoryzuj i Zapłać
                      </>
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

function ProductCatalogPage({ products, categories, filters, setFilters, loading, navigate, user, onAddProduct, onDeleteProduct, onAddToCart }) {
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
                  className={`btn btn-sm ${showAddForm ? 'btn-secondary' : 'btn-danger'}`}
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
                <input type="text" className="form-control form-control-sm" placeholder="Nazwa produktu" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
              </div>
              <div className="col-md-4">
                <input type="text" className="form-control form-control-sm" placeholder="Kategoria (np. Rowery, Akcesoria)" required value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
              </div>
              <div className="col-md-2">
                <input type="number" step="0.01" className="form-control form-control-sm" placeholder="Cena (PLN)" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
              </div>
              <div className="col-md-2">
                <input type="number" className="form-control form-control-sm" placeholder="Ilość na stanie" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
              </div>
              <div className="col-md-8">
                <input type="text" className="form-control form-control-sm" placeholder="URL do zdjęcia (opcjonalnie)" value={newProduct.imageUrl} onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})} />
              </div>
              <div className="col-md-4">
                <button type="submit" className="btn btn-success btn-sm w-100">Zapisz produkt w sklepie</button>
              </div>
              <div className="col-12">
                <textarea className="form-control form-control-sm" rows="1" placeholder="Opis produktu" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})}></textarea>
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
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {loading ? <div className="text-center py-4">Ładowanie...</div> : (
            <div className="row g-4">
              {products.map(product => (
                  <div className="col-sm-6 col-md-4 col-lg-3" key={product.id}>
                    <div className="card h-100 border text-center">
                      <img src={product.imageUrl} className="card-img-top" alt={product.name} style={{ height: "140px", objectFit: "cover" }} />
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title h6 text-truncate">{product.name}</h5>
                        <p className="card-text fw-bold text-primary mb-1">{product.price.toFixed(2)} PLN</p>
                        <p className="mb-2 text-muted" style={{ fontSize: '12px' }}>Dostępność: {product.stock > 0 ? `${product.stock} szt.` : 'Brak na stanie'}</p>

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

function ProductDetailsPage({ product, user, onChangeStock, onAddToCart, navigate }) {
  if (!product) return <div className="p-4 text-center">Ładowanie...</div>;

  const [inputStock, setInputStock] = useState(product.stock);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setInputStock(product.stock);
    setQuantity(1);
  }, [product.id, product.stock]);

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

function HomePage({ navigate }) {
  return (
      <section className="p-4 bg-white border rounded text-center">
        <h1 className="h2 mb-3">VeloShop</h1>
        <p className="text-secondary mb-4">Witaj w systemie obsługi salonu rowerowego.</p>
        <div className="d-flex justify-content-center gap-2">
          <button className="btn btn-primary" onClick={() => navigate("/zakupy")}>Zakupy</button>
          <button className="btn btn-outline-primary" onClick={() => navigate("/koszyk")}>Koszyk</button>
          <button className="btn btn-outline-dark" onClick={() => navigate("/naprawy")}>Serwis napraw</button>
        </div>
      </section>
  );
}

function NotFound({ navigate }) {
  return <section className="p-4 bg-white border rounded text-center"><h3>404</h3><button className="btn btn-primary" onClick={() => navigate("/")}>Główna</button></section>;
}

function AuthPanel({ authMode, setAuthMode, authForm, setAuthForm, submitAuth }) {
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

function AccountPage({ user, repairs, orders, changeStatus, changeOrderStatus, clearHistory, navigate }) {
  return (
      <div className="row g-4">
        <div className="col-lg-4">
          <section className="p-4 bg-white border rounded">
            <h1 className="h4 mb-3">Konto</h1>
            <p className="mb-1"><strong>Zalogowany jako:</strong> {user.firstName} {user.lastName}</p>
            <p className="text-muted small">{user.email}</p>
          </section>
        </div>
        <div className="col-lg-8">
          <OrderHistory user={user} orders={orders} changeOrderStatus={changeOrderStatus} navigate={navigate} />
          <div className="mt-4">
            <RepairHistory user={user} repairs={repairs} changeStatus={changeStatus} clearHistory={clearHistory} />
          </div>
        </div>
      </div>
  );
}

function CartPage({ cart, cartTotal, user, checkoutForm, setCheckoutForm, onRemove, onUpdateQuantity, onClearCart, onSubmitOrder, loading, navigate }) {
  if (cart.length === 0) {
    return (
      <section className="p-4 bg-white border rounded text-center">
        <h1 className="h4 mb-3">Koszyk</h1>
        <p className="text-secondary mb-3">Twój koszyk jest pusty.</p>
        <button className="btn btn-primary" onClick={() => navigate("/zakupy")}>Przejdź do sklepu</button>
      </section>
    );
  }

  return (
    <section className="p-4 bg-white border rounded">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h1 className="h3 mb-0">Koszyk</h1>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onClearCart}>
          Wyczyść koszyk
        </button>
      </div>
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="d-flex flex-column gap-3">
            {cart.map((item) => (
              <div className="d-flex gap-3 border rounded p-3 align-items-center" key={item.productId}>
                <img src={item.imageUrl} alt={item.name} className="rounded" style={{ width: "72px", height: "72px", objectFit: "cover" }} />
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
          <div className="p-4 bg-light border rounded">
            <h2 className="h5 mb-3">Podsumowanie</h2>
            <div className="d-flex justify-content-between mb-3">
              <span>Razem:</span>
              <strong>{cartTotal.toFixed(2)} PLN</strong>
            </div>

            {!user && (
              <div className="alert alert-warning py-2 small">
                Zaloguj się, aby złożyć zamówienie.
              </div>
            )}

            <form onSubmit={onSubmitOrder}>
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

function OrderDetailsPage({ order, loading, user, navigate, changeOrderStatus, onRetryPayment }) {
  if (loading) {
    return <div className="p-4 text-center">Ładowanie zamówienia...</div>;
  }

  if (!order) {
    return (
      <section className="p-4 bg-white border rounded text-center">
        <h1 className="h4 mb-3">Nie znaleziono zamówienia</h1>
        <button className="btn btn-primary" onClick={() => navigate("/moje-konto")}>← Moje konto</button>
      </section>
    );
  }

  return (
    <section className="p-4 bg-white border rounded">
      <button className="btn btn-link p-0 mb-3 text-decoration-none" onClick={() => navigate("/moje-konto")}>← Moje konto</button>

      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-4">
        <div>
          <h1 className="h3 mb-1">Zamówienie #{order.id}</h1>
          <small className="text-muted">
            {new Date(order.createdAt).toLocaleString("pl-PL")}
          </small>
        </div>
        <span className={`badge ${orderStatusBadgeClass(order.status)} p-2`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {order.status === "failed" && (
        <div className="alert alert-danger">
          <strong>Płatność nieudana.</strong>{" "}
          {order.paymentMessage || "Transakcja została odrzucona."}
          <div className="d-flex gap-2 flex-wrap mt-3">
            <button
              type="button"
              className="btn btn-sm btn-danger"
              disabled={loading}
              onClick={() => onRetryPayment(order)}
            >
              {loading ? "Przetwarzanie..." : "Spróbuj opłacić ponownie"}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => navigate("/koszyk")}
            >
              Wróć do koszyka
            </button>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-7">
          <h2 className="h5 mb-3">Pozycje</h2>
          <div className="table-responsive">
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th className="text-center">Ilość</th>
                  <th className="text-end">Cena</th>
                  <th className="text-end">Razem</th>
                </tr>
              </thead>
              <tbody>
                {(order.OrderItems || []).map((item) => (
                  <tr key={item.id}>
                    <td>{item.productName}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-end">{item.unitPrice.toFixed(2)} PLN</td>
                    <td className="text-end">{(item.unitPrice * item.quantity).toFixed(2)} PLN</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="3" className="text-end fw-bold">Suma:</td>
                  <td className="text-end fw-bold">{order.totalAmount.toFixed(2)} PLN</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="p-3 bg-light border rounded">
            <h2 className="h5 mb-3">Dane zamówienia</h2>
            <dl className="small mb-0">
              <dt className="text-muted">Adres dostawy</dt>
              <dd>{order.deliveryAddress}</dd>
              <dt className="text-muted">Metoda płatności</dt>
              <dd>{paymentMethodLabel(order.paymentMethod)}</dd>
              {order.paymentTransactionId && (
                <>
                  <dt className="text-muted">ID transakcji</dt>
                  <dd>{order.paymentTransactionId}</dd>
                </>
              )}
              {order.paymentMessage && (
                <>
                  <dt className="text-muted">Płatność</dt>
                  <dd>{order.paymentMessage}</dd>
                </>
              )}
              {user?.role === "admin" && (
                <>
                  <dt className="text-muted">Klient</dt>
                  <dd>{order.userEmail}</dd>
                </>
              )}
            </dl>
          </div>

          {user?.role === "admin" && ["paid", "shipped"].includes(order.status) && (
            <div className="p-3 bg-light border rounded mt-3">
              <h3 className="h6 fw-bold mb-2">Zmiana statusu</h3>
              <div className="d-flex gap-2 flex-wrap">
                {orderAdminStatuses.map((status) => (
                  <button
                    key={status.value}
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => changeOrderStatus(order, status.value)}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function OrderHistory({ user, orders, changeOrderStatus, navigate }) {
  return (
    <section className="p-4 bg-white border rounded">
      <h2 className="h5 mb-3">Historia zamówień</h2>
      {orders.length === 0 ? (
        <p className="text-secondary small mb-0">Brak zamówień.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {orders.map((order) => (
            <div className="border rounded p-3" key={order.id}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <strong>Zamówienie #{order.id}</strong>
                  <small className="d-block text-muted">{order.deliveryAddress}</small>
                </div>
                <span className={`badge ${orderStatusBadgeClass(order.status)}`}>
                  {orderStatusLabel(order.status)}
                </span>
              </div>
              <ul className="small mb-2 ps-3">
                {(order.OrderItems || []).map((item) => (
                  <li key={item.id}>
                    {item.productName} × {item.quantity} — {(item.unitPrice * item.quantity).toFixed(2)} PLN
                  </li>
                ))}
              </ul>
              <div className="d-flex justify-content-between align-items-center">
                <strong>{order.totalAmount.toFixed(2)} PLN</strong>
                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => navigate(`/zamowienie/${order.id}`)}
                  >
                    Szczegóły
                  </button>
                  {user?.role === "admin" && ["paid", "shipped"].includes(order.status) && (
                    orderAdminStatuses.map((status) => (
                      <button
                        key={status.value}
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => changeOrderStatus(order, status.value)}
                      >
                        {status.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RepairCalendar({ calendar, selectedDate, setSelectedDate, user }) {
  const weekdays = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
  const leadingEmptyDays = calendar.length ? (new Date(`${calendar[0].date}T12:00:00`).getDay() || 7) - 1 : 0;

  return (
    <div className="p-4 bg-white border rounded h-100">
      <h2 className="h5 mb-3">Kalendarz terminów</h2>
      <div className="calendar-weekdays">
        {weekdays.map((day) => <div key={day}>{day}</div>)}
      </div>
      <div className="calendar-grid">
        {Array.from({ length: leadingEmptyDays }).map((_, index) => (
          <div className="calendar-day empty" key={`empty-${index}`} aria-hidden="true"></div>
        ))}
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
              <strong>{availability === "free" ? "wolny" : availability === "partial" ? "częściowo zajęty" : "brak terminu"}</strong>
              {user?.role === "admin" && <small>{day.freeHours}h wolne / {day.bookedHours}h zajęte</small>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RepairBooking({ user, services, repairForm, setRepairForm, estimate, submitRepair }) {
  return (
      <div className="p-4 bg-white border rounded">
        <h2 className="h5 mb-3">Zlecenie naprawy</h2>
        {!user && <div className="alert alert-warning py-1 small">Zaloguj się, by złożyć zlecenie.</div>}
        <form onSubmit={submitRepair}>
          <select className="form-select mb-2" value={repairForm.repairServiceId} onChange={(e) => setRepairForm({ ...repairForm, repairServiceId: e.target.value })}>
            <option value="">Wybierz naprawę</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name} - {s.price} zł</option>)}
          </select>
          <input className="form-control mb-2" placeholder="Opis roweru" value={repairForm.bikeDescription} onChange={(e) => setRepairForm({ ...repairForm, bikeDescription: e.target.value })} />
          <textarea className="form-control mb-3" rows="2" placeholder="Opis usterki" value={repairForm.issueDescription} onChange={(e) => setRepairForm({ ...repairForm, issueDescription: e.target.value })} />
          {estimate && <div className="alert alert-light border small py-2 mb-3">Odbiór szacowany: {estimate.readyDate}</div>}
          <button className="btn btn-primary w-100" disabled={!user}>Przejdź do płatności</button>
        </form>
      </div>
  );
}

function RepairHistory({ user, repairs, changeStatus, clearHistory }) {
  return (
      <section className="p-4 bg-white border rounded">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">Historia napraw</h2>
          {user?.role === "admin" && <button className="btn btn-outline-danger btn-sm" onClick={clearHistory}>Wyczyść</button>}
        </div>
        <div className="row g-2">
          {repairs.map(r => (
              <div className="col-12 border rounded p-3" key={r.id}>
                <div className="d-flex justify-content-between">
                  <strong>{r.bikeDescription}</strong>
                  <span className="badge bg-secondary">{statusLabel(r.status)}</span>
                </div>
                <small className="text-muted d-block">Termin: {r.dropOffDate} do {r.readyDate}</small>
                {user?.role === "admin" && !["completed", "cancelled"].includes(r.status) && (
                    <div className="d-flex gap-2 mt-2">
                      {finalStatuses.map(s => <button key={s.value} className="btn btn-sm btn-outline-primary" onClick={() => changeStatus(r, s.value)}>{s.label}</button>)}
                    </div>
                )}
              </div>
          ))}
        </div>
      </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
