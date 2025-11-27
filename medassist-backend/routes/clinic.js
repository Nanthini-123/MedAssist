// backend/routes/clinic.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Static clinic info — replace with your real clinic details or DB table
const CLINIC = {
  id: "clinic_1",
  name: "MedAssist Clinic",
  address: "No. 10 Health Lane, Chennai, India",
  lat: 13.0827,
  lng: 80.2707,
  reception_phone: "+91-9876543210",
  maps_place_id: "", // optional if you use Google Places
};

// Haversine distance in km between two points
function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// GET /api/clinic?lat=..&lng=..
router.get("/", async (req, res) => {
  try {
    const { lat, lng, expand } = req.query;
    const out = { ...CLINIC };

    if (lat && lng) {
      const km = distanceKm(Number(lat), Number(lng), CLINIC.lat, CLINIC.lng);
      out.distance_km = Number(km.toFixed(2));
    }

    // If expand=places -> call Google Places to fetch photos/hours (optional)
    if (expand === "places" && process.env.GOOGLE_MAPS_API_KEY && CLINIC.maps_place_id) {
      try {
        const key = process.env.GOOGLE_MAPS_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${CLINIC.maps_place_id}&fields=name,formatted_address,opening_hours,photos,website&key=${key}`;
        const r = await fetch(url);
        const j = await r.json();
        out.places = j.result;
      } catch (err) {
        console.warn("places fetch failed", err.message);
      }
    }

    // Provide Google Maps link
    out.maps_link = `https://www.google.com/maps/search/?api=1&query=${CLINIC.lat},${CLINIC.lng}`;
    res.json(out);
  } catch (err) {
    console.error("clinic error", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;