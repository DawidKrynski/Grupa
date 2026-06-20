import React from "react";
import { RepairCalendar } from "../components/RepairCalendar.jsx";
import { RepairBooking } from "../components/RepairBooking.jsx";

export function RepairsPage({ user, calendar, services, repairForm, setRepairForm, estimate, submitRepair }) {
  return (
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
