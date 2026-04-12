const mongoose = require("mongoose");

const MONGO_URI = "mongodb://127.0.0.1:27017/psych_ai";

const Hospital = require("./auth-backend/models/Hospital");
const Doctor = require("./auth-backend/models/Doctor");
const User = require("./auth-backend/models/User");
const Admin = require("./auth-backend/models/Admin");
const StressPrediction = require("./auth-backend/models/StressPrediction");
const Appointment = require("./auth-backend/models/Appointment");

const specializations = ["Trauma", "Relationships", "Financial"];
const providerTypes = [
  "Clinical Psychologist",
  "Counseling Psychologist",
  "Psychiatrist",
  "LMFT",
  "Financial Counselor"
];

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log("DB Connected");

  await Promise.all([
    Hospital.deleteMany({}),
    Doctor.deleteMany({}),
    User.deleteMany({}),
    Admin.deleteMany({}),
    StressPrediction.deleteMany({}),
    Appointment.deleteMany({})
  ]);

  // ADMIN
  await Admin.create({
    name: "Admin",
    email: "admin@test.com",
    password: "123456"
  });

  // HOSPITALS
 // HOSPITALS (VERIFIED + UNVERIFIED MIX)
const hospitals = [];

for (let i = 1; i <= 8; i++) {
  const isVerified = i <= 5; // first 5 verified, rest not

  const h = await Hospital.create({
    name: `Hospital ${i}`,
    email: `hospital${i}@test.com`,
    password: "123456",
    verified: isVerified,
    location: {
      type: "Point",
      coordinates: [77.2 + i * 0.01, 28.6 + i * 0.01]
    },
    bookingType: i % 2 === 0 ? "AUTO" : "APPROVAL"
  });

  hospitals.push(h);
}

  // DOCTORS (REALISTIC MIX)
  const doctors = [];

  for (let i = 1; i <= 50; i++) {
    const specialization = rand(specializations);
    const hospital = rand(hospitals);

    doctors.push({
      name: `Doctor ${i}`,
      email: `doctor${i}@test.com`,
      password: "123456",
      specialization: [specialization],
      providerType: rand(providerTypes),
      experienceYears: Math.floor(Math.random() * 10) + 1,
      hospital: hospital._id,
      availability: [
        {
          day: rand(days),
          slots: ["10:00", "11:00", "12:00"]
        }
      ]
    });
  }

  // ADD IMPORTANT EDGE DOCTORS
  doctors.push(
    {
      name: "Dr Psychiatrist",
      email: "psy@test.com",
      password: "123456",
      specialization: ["Trauma"],
      providerType: "Psychiatrist",
      experienceYears: 12,
      hospital: hospitals[0]._id,
      availability: [{ day: "Mon", slots: ["10:00"] }]
    },
    {
      name: "Dr Emotional Specialist",
      email: "emo@test.com",
      password: "123456",
      specialization: ["Relationships"],
      providerType: "Counseling Psychologist",
      experienceYears: 7,
      hospital: hospitals[1]._id,
      availability: [{ day: "Tue", slots: ["11:00"] }]
    },
    {
      name: "Dr LMFT",
      email: "lmft@test.com",
      password: "123456",
      specialization: ["Relationships"],
      providerType: "LMFT",
      experienceYears: 8,
      hospital: hospitals[2]._id,
      availability: [{ day: "Wed", slots: ["12:00"] }]
    }
  );

  await Doctor.insertMany(doctors);

  // USERS
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const u = await User.create({
      name: `User ${i}`,
      email: `user${i}@test.com`,
      password: "123456"
    });
    users.push(u);
  }

  // PREDICTIONS (COVER ALL CASES)
  const predictions = [
    // TRAUMA
    {
      traumaStress: 85,
      relationshipStress: 20,
      financialStress: 10,
      emotionalStress: 40,
      primaryProblem: "TRAUMA",
      medicationNeed: "HIGH",
      topIndicators: ["past"]
    },

    // RELATIONSHIP
    {
      traumaStress: 20,
      relationshipStress: 80,
      financialStress: 10,
      emotionalStress: 50,
      primaryProblem: "RELATIONSHIP",
      medicationNeed: "LOW",
      topIndicators: ["partner"]
    },

    // FINANCIAL
    {
      traumaStress: 10,
      relationshipStress: 20,
      financialStress: 90,
      emotionalStress: 30,
      primaryProblem: "FINANCIAL",
      medicationNeed: "MEDIUM",
      topIndicators: ["money"]
    },

    // EMOTIONAL
    {
      traumaStress: 20,
      relationshipStress: 30,
      financialStress: 10,
      emotionalStress: 95,
      primaryProblem: "EMOTIONAL",
      medicationNeed: "LOW",
      topIndicators: ["mental", "tired"]
    },

    // MIX CASES
    {
      traumaStress: 80,
      relationshipStress: 78,
      financialStress: 10,
      emotionalStress: 20,
      primaryProblem: "TRAUMA + RELATIONSHIP",
      medicationNeed: "MEDIUM"
    },
    {
      traumaStress: 80,
      relationshipStress: 20,
      financialStress: 10,
      emotionalStress: 78,
      primaryProblem: "TRAUMA + EMOTIONAL",
      medicationNeed: "MEDIUM"
    },
    {
      traumaStress: 10,
      relationshipStress: 75,
      financialStress: 10,
      emotionalStress: 73,
      primaryProblem: "RELATIONSHIP + EMOTIONAL",
      medicationNeed: "LOW"
    },
    {
      traumaStress: 10,
      relationshipStress: 20,
      financialStress: 80,
      emotionalStress: 78,
      primaryProblem: "FINANCIAL + EMOTIONAL",
      medicationNeed: "MEDIUM"
    }
  ];

  // ADD RANDOM PREDICTIONS
  for (let i = 0; i < 25; i++) {
    predictions.push({
      traumaStress: Math.floor(Math.random() * 100),
      relationshipStress: Math.floor(Math.random() * 100),
      financialStress: Math.floor(Math.random() * 100),
      emotionalStress: Math.floor(Math.random() * 100),
      medicationNeed: rand(["LOW", "MEDIUM", "HIGH"]),
      topIndicators: []
    });
  }

  // ATTACH USERS
  const finalPredictions = predictions.map(p => ({
    ...p,
    user: rand(users)._id
  }));

  await StressPrediction.insertMany(finalPredictions);

  console.log("🔥 FULL ADVANCED SEED COMPLETE");
  process.exit();
};

seed();