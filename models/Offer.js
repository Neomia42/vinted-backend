const mongoose = require("mongoose");

const Offer = mongoose.model("Offer", {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: Array,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  product_picture: Object,
  product_pictures_add: Array,
});

module.exports = Offer;
