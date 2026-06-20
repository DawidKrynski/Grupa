import React from "react";
import { formatDate } from "../utils/dates.js";

export function RepairCalendar({ calendar, selectedDate, setSelectedDate, user }) {
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
