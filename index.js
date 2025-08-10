require("dotenv").config(); // Import dotenv pour lire le fichier .env
const express = require("express"); // import du package express
const cors = require("cors");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const app = express(); // création du serveur
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);
const User = require("./models/User");
const Offer = require("./models/Offer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Routes
const signupRoutes = require("./routes/signup");
app.use(signupRoutes);
const authRoutes = require("./routes/auth");
app.use(authRoutes);
const publishRoutes = require("./routes/offer");
app.use(publishRoutes);
const offersRoutes = require("./routes/offers");
app.use(offersRoutes);
// Route bienvenue
app.get("/", (req, res) => {
  try {
    res.status(200).json({ message: "Welcome to Vinted API by Neomia42" });
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.all(/.*/, (req, res) => {
  return res.status(404).json("Not found");
});

const PORT = process.env.PORT || 3000; // Port d'écoute, par défaut 3000
app.listen(PORT, () => {
  console.log(`Server has started on port ${PORT}`);
});
