const express = require("express"); // import du package express
const router = express.Router();

//import models
const Offer = require("../models/Offer"); // Import du modèle Offer

// Route de tri Get
router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    let page = 1; // Valeur par défaut
    let limit = 5;
    let skip = 0;
    if (req.query.limit) {
      limit = Number(req.query.limit);
    }
    if (req.query.page) {
      if (req.query.limit) {
        limit = parseInt(req.query.limit);
      }
      if (req.query.page) {
        page = parseInt(req.query.page);
        skip = (page - 1) * limit;
      }
    }

    if (req.query.title) {
      filters.product_name = new RegExp(title, "i");
    }
    // if (priceMin || priceMax) {
    //   filters.product_price = {};
    //   if (priceMin) {
    //     filters.product_price.$gt = parseInt(priceMin);
    //   }
    //   if (priceMax) {
    //     filters.product_price.$lt = parseInt(priceMax);
    //   }

    // }
    if (req.query.priceMax) {
      filters.product_price = { $lt: Number(req.query.priceMax) };
    }
    if (req.query.priceMin) {
      if (filters.product_price) {
        filters.product_price.$gte = Number(req.query.priceMin);
      } else {
        filters.product_price = { $gte: Number(req.query.priceMin) };
      }
    }
    let sortOptions = {};
    if (req.query.sort) {
      if (req.query.sort === "price_desc") {
        sortOptions = { product_price: -1 };
      }
      if (req.query.sort === "price_asc") {
        sortOptions = { product_price: 1 };
      }
    }

    const offers = await Offer.find(filters)
      .skip(skip)
      .limit(limit)
      .sort(sortOptions);

    const count = await Offer.countDocuments(filters);

    return res.status(200).json({ nombreAnnonces: count, offers: offers });
    return res.status(200).json(offers);
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
