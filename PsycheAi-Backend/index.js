const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const apiRoutes = require("./routes/apiRoutes");

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// DB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error(err));