const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload"); // Import du middleware pour gérer les fichiers upload
const uid = require("uid2"); // import du package uid2
const SHA256 = require("crypto-js/sha256"); // nous servira pour l'encryptage
const encBase64 = require("crypto-js/enc-base64"); //  nous servira pour

// models
const User = require("../models/User");

// CREATE USER
router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    if (
      !req.body.email ||
      !req.body.username ||
      !req.body.password ||
      req.body.newsletter === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Veuillez remplir tous les champs" });
    }
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Les informations fournies ne sont pas valides" });
    }
    let avatarUrl = null;

    if (req.files && req.files.avatar) {
      try {
        let file = req.files.avatar;

        const fileBase64 = `data:${file.mimetype};base64,${file.data.toString(
          "base64"
        )}`;

        const result = await cloudinary.uploader.upload(fileBase64, {
          folder: "vinted/avatars",
          public_id: `avatar_${req.body.email
            .replace("@", "_at_")
            .replace(".", "_")}`,
        });

        avatarUrl = result.secure_url;
      } catch (error) {
        return res.status(500).json({ message: "Avatar upload failed" });
      }
    }
    const salt = uid(16);
    const hash = SHA256(req.body.password + salt).toString(encBase64);
    const token = uid(32);
    const newUser = new User({
      account: {
        username: req.body.username,
        avatar: avatarUrl,
        email: req.body.email,
        newsletter: req.body.newsletter,
        token: token,
        hash: hash,
        salt: salt,
      },
    });
    console.log(newUser);
    await newUser.save();
    const resObject = {
      _id: newUser._id,
      token: newUser.token,
      account: {
        username: newUser.account.username,
        avatar: newUser.account.avatar,
      },
    };
    return res.status(201).json(resObject);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
