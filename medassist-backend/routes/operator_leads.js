import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const CLINIC = {
  id: "clinic_1",
  name: "MedAssist Clinic",
  address: "No. 10 Health Lane, Chennai, India",
  lat: 13.0827,
  lng: 80.2707,
  reception_phone: "+91-9876543210",
  maps_place_id: ""
};

function distanceKm(lat1, lon1, lat2, lon2) {
  const toRad = x => x * Math.PI / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

router.get("/", async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const out = { ...CLINIC };

    if (lat && lng) {
      const km = distanceKm(Number(lat), Number(lng), CLINIC.lat, CLINIC.lng);
      out.distance_km = Number(km.toFixed(2));
    }

    out.maps_link = `https://www.google.com/maps/search/?api=1&query=${CLINIC.lat},${CLINIC.lng}`;
    res.json(out);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;