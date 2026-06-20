import React from "react";
import { RepairCalendar } from "../components/RepairCalendar.jsx";
import { RepairBooking } from "../components/RepairBooking.jsx";

export function RepairsPage({ user, calendar, services, repairForm, setRepairForm, estimate, submitRepair }) {
  return (
    <>
      <section className="page-panel page-header mb-4">
        <h1 className="h3"><i className="bi bi-wrench-adjustable me-2"></i>Rezerwacja napraw</h1>
        <p>Zgłoś usterkę, wybierz wolny termin z kalendarza i opłać usługę online.</p>
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
  );
}
