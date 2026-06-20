import React, { useEffect, useMemo, useState } from "react";
import { request } from "./api/client.js";
import {
  ORDER_API,
  PAYMENT_API,
  PRODUCT_API,
  REPAIR_API,
  USER_API
} from "./api/config.js";
import { Navbar } from "./components/Navbar.jsx";
import { orderStatusLabel } from "./utils/labels.js";
import { loadCartFromStorage } from "./utils/cart.js";
import { todayKey } from "./utils/dates.js";
import { AccountGate, AccountPage } from "./pages/AccountPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { NotFound } from "./pages/NotFound.jsx";
import { OrderDetailsPage, OrderGate } from "./pages/OrderDetailsPage.jsx";
import { PaymentGatePage } from "./pages/PaymentGatePage.jsx";
import { ProductCatalogPage } from "./pages/ProductCatalogPage.jsx";
import { ProductDetailsPage } from "./pages/ProductDetailsPage.jsx";
import { RepairsPage } from "./pages/RepairsPage.jsx";

export default function App() {
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
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);

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
    if (path === "/") loadFeaturedProducts();
  }, [path]);

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

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

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

  async function loadFeaturedProducts() {
    setFeaturedLoading(true);
    try {
      const data = await request(`${PRODUCT_API}/products`);
      const featured = (data || [])
        .filter((product) => product.stock > 0)
        .slice(0, 5);
      setFeaturedProducts(featured);
    } catch (err) {
      console.error(err);
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  }

  async function loadSingleProduct(id) {
    try {
      const data = await request(`${PRODUCT_API}/products/${id}`);
      setSelectedProduct(data);
    } catch {
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
      const productsData = await Promise.all(
        cart.map((item) => request(`${PRODUCT_API}/products/${item.productId}`).catch(() => null))
      );

      const next = cart.flatMap((item, index) => {
        const product = productsData[index];

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

    const selectedService = services.find((s) => s.id === Number(repairForm.repairServiceId));

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

      setProducts(products.filter((p) => p.id !== productId));
      setMessage("Produkt został pomyślnie usunięty.");
    } catch (error) {
      setMessage(`Błąd usuwania produktu: ${error.message}`);
    }
  }

  const isProductDetailsPath = path.startsWith("/produkt/");
  const isOrderDetailsPath = path.startsWith("/zamowienie/");
  const validPath = path === "/" || path === "/naprawy" || path === "/logowanie" || path === "/moje-konto" || path === "/zakupy" || path === "/koszyk" || path === "/platnosc" || isProductDetailsPath || isOrderDetailsPath;

  return (
    <div className="app-shell">
      <Navbar
        path={path}
        cartCount={cartCount}
        user={user}
        accountMenuOpen={accountMenuOpen}
        setAccountMenuOpen={setAccountMenuOpen}
        navigate={navigate}
        logout={logout}
      />

      <main className="container py-4">
        {message && (
          <div className={`alert app-alert ${message.startsWith("Błąd") ? "alert-danger" : "alert-success"} py-2`}>
            {message}
          </div>
        )}

        {!validPath && <NotFound navigate={navigate} />}
        {path === "/" && (
          <HomePage
            navigate={navigate}
            featuredProducts={featuredProducts}
            featuredLoading={featuredLoading}
            onAddToCart={addToCart}
          />
        )}

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
            <OrderGate navigate={navigate} />
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
              <LoginPage
                user={user}
                navigate={navigate}
                authMode={authMode}
                setAuthMode={setAuthMode}
                authForm={authForm}
                setAuthForm={setAuthForm}
                submitAuth={submitAuth}
              />
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
            <AccountGate navigate={navigate} />
          )
        )}

        {path === "/naprawy" && (
          <RepairsPage
            user={user}
            calendar={calendar}
            services={services}
            repairForm={repairForm}
            setRepairForm={setRepairForm}
            estimate={estimate}
            submitRepair={handleGoToPayment}
          />
        )}
      </main>

      <footer className="site-footer">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <strong>VeloShop</strong>
          <span className="small">© 2026 — sklep i serwis rowerowy</span>
        </div>
      </footer>
    </div>
  );
}
