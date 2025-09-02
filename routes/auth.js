const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256"); // nous servira pour l'encryptage
const encBase64 = require("crypto-js/enc-base64"); //  nous servira pour

//import models
const User = require("../models/User");

// Route Post Login User
router.post("/user/login", async (req, res) => {
  try {
    const userExisting = await User.findOne({ email: req.body.email });
    if (!req.body.email || !req.body.password) {
      return res
        .status(400)
        .json({ message: "Veuillez remplir tous les champs" });
    }
    if (!userExisting) {
      return res
        .status(400)
        .json({ message: "Identifiant ou Mot de pass incorrect" });
    }
    console.log(userExisting);
    const salt = userExisting.salt;
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    // Vérification du mot de passe
    if (hash !== userExisting.hash) {
      return res
        .status(400)
        .json({ message: "Identifiant ou Mot de passe incorrect" });
    }

    const resObject = {
      _id: userExisting._id,
      token: userExisting.token,
      account: {
        username: userExisting.account.username,
      },
    };
    return res.status(200).json(resObject);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
