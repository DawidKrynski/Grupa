import React from "react";
import { orderAdminStatuses } from "../constants/statuses.js";
import { orderStatusBadgeClass, orderStatusLabel } from "../utils/labels.js";

export function OrderHistory({ user, orders, changeOrderStatus, navigate }) {
  return (
    <section className="page-panel">
      <h2 className="h5 mb-3">Historia zamówień</h2>
      {orders.length === 0 ? (
        <p className="text-secondary small mb-0">Brak zamówień.</p>
      ) : (
        <div className="d-flex flex-column gap-3">
          {orders.map((order) => (
            <div className="history-item" key={order.id}>
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
