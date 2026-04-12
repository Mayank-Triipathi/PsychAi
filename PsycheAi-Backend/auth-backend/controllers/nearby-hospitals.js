const Hospital = require("../models/Hospital");

// GET nearby hospitals
const nearbyHospitals = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    const hospitals = await Hospital.find({
      verified: true,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [
              parseFloat(lng),
              parseFloat(lat)
            ],
          },
        },
      },
    });

    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { nearbyHospitals };