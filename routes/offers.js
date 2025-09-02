const express = require("express"); // import du package express
const router = express.Router();

//import models
const Offer = require("../models/Offer"); // Import du modèle Offer

// Route de tri Get
router.get("/offers", async (req, res) => {
  try {
    const filters = {};

    // Pagination sécurisée
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    // Filtre titre
    if (req.query.title) {
      const title = req.query.title;
      filters.product_name = new RegExp(title, "i");
    }

    // Filtres prix
    if (req.query.priceMin || req.query.priceMax) {
      filters.product_price = {};
      if (req.query.priceMin) {
        filters.product_price.$gte = Number(req.query.priceMin);
      }
      if (req.query.priceMax) {
        filters.product_price.$lte = Number(req.query.priceMax);
      }
    }

    // Tri
    let sortOptions = {};
    if (req.query.sort === "price_desc") sortOptions = { product_price: -1 };
    if (req.query.sort === "price_asc") sortOptions = { product_price: 1 };

    const offers = await Offer.find(filters)
      .select("product_name product_price product_image product_pictures owner")
      .populate("owner", "account")
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const count = await Offer.countDocuments(filters);

    return res.status(200).json({
      nombreAnnonces: count,
      page,
      limit,
      offers,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/offers/:id", async (req, res) => {
  try {
    const offerId = req.params.id;
    const offer = await Offer.findById(offerId).populate("owner", "account");
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }
    return res.status(200).json(offer);
  } catch (error) {
    console.error("Error fetching offer:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
// router.get("offers");

module.exports = router;
