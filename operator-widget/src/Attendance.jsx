import { useState, useEffect } from "react";
import axios from "axios";

export default function Attendance() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API}/api/booking/today`);
    setBookings(res.data);
  };

  const update = async (id, status) => {
    await axios.post(`${import.meta.env.VITE_API}/api/attendance/update`, {
      booking_id: id,
      status
    });
    fetchBookings(); // refresh
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Today’s Appointments</h2>

      {bookings.map((b) => (
        <div key={b.id} className="p-3 mb-3 border rounded-lg shadow-sm bg-white">
          <p><b>Patient:</b> {b.visitor_name}</p>
          <p><b>Doctor:</b> {b.doctor_name}</p>
          <p><b>Time:</b> {new Date(b.timeslot).toLocaleString()}</p>

          <div className="flex gap-2 mt-3">
            <button
              onClick={() => update(b.id, "ATTENDED")}
              className="px-3 py-1 bg-green-600 text-white rounded"
            >
              Attended
            </button>

            <button
              onClick={() => update(b.id, "NO_SHOW")}
              className="px-3 py-1 bg-red-600 text-white rounded"
            >
              No-Show
            </button>

            <button
              onClick={() => update(b.id, "CANCELLED")}
              className="px-3 py-1 bg-gray-600 text-white rounded"
            >
              Cancelled
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}