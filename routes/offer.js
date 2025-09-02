const express = require("express"); // import du package express
const router = express.Router();
const fileUpload = require("express-fileupload"); // Import du middleware pour gérer les fichiers upload
const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64"); // Import de la fonction utilitaire pour convertir en base64
// Import models
const Offer = require("../models/Offer"); // Import du modèle Offer
const isAuthenticated = require("../middleware/isAuthentificated");

router.get("/offer/:id", async (req, res) => {
  try {
    const offerId = req.params.id;
    // Vérifier si l'offre existe
    const offer = await Offer.findById(offerId).populate({
      path: "owner",
      select: "account.username account.avatar _id",
    });
    if (offer) {
      res.status(200).json(offer);
    } else {
      res.status(404).json({
        error: "Aucune offre n'est disponible pour cet enregistrement",
      });
    }
  } catch (error) {
    console.error("Error fetching offer:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  convertToBase64,
  async (req, res) => {
    try {
      //poster une annonce
      const { title, description, brand, size, condition, couleur, city } =
        req.body;
      if (!req.files || !req.files.picture) {
        return res
          .status(400)
          .json({ error: "Une image est obligatoire pour publier une offre" });
      }
      if (req.body.description.length > 500) {
        return res.status(400).json({
          message: "La description ne doit pas dépasser 500 caractères",
        });
      }
      if (req.body.title.length > 50) {
        return res.status(400).json({
          message: "Le titre ne doit pas dépasser 50 caractères",
        });
      }
      const priceNum = Number(req.body.price);
      if (isNaN(priceNum) || priceNum < 0 || priceNum >= 100000) {
        return res.status(400).json({
          message: "le prix doit être compris entre 0 et 100000",
        });
      }
      if (req.files.pictures && req.files.pictures.length > 5) {
        return res.status(400).json({
          message: "Vous ne pouvez uploader que 5 images supplémentaires",
        });
      }
      const newOffer = new Offer({
        product_name: title,
        product_description: description,
        product_price: priceNum,
        product_details: [
          { MARQUE: brand },
          { TAILLE: size },
          { ETAT: condition },
          { COULEUR: couleur },
          { EMPLACEMENT: city },
        ],

        owner: req.user._id,

        product_image: {
          secure_url: "",
        },
        product_pictures: [],
      });

      await newOffer.save();

      const uploadResponse = await cloudinary.uploader.upload(
        req.files.picture.base64,
        {
          folder: `vinted/offers/${newOffer._id}`,
          public_id: "product_image",
        }
      );
      newOffer.product_image = {
        secure_url: uploadResponse.secure_url,
        public_id: uploadResponse.public_id,
      };
      if (req.files && req.files.pictures) {
        const pictures = Array.isArray(req.files.pictures)
          ? req.files.pictures
          : [req.files.pictures];

        const maxPictures = Math.min(pictures.length, 5);

        for (let i = 0; i < maxPictures; i++) {
          const uploadResponse = await cloudinary.uploader.upload(
            pictures[i].base64,
            {
              folder: `vinted/offers/${newOffer._id}`,
              public_id: `additional_image_${i}`,
            }
          );

          newOffer.product_pictures.push({
            secure_url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id,
          });
        }
      }
      await newOffer.save();
      const populateOffer = await Offer.findById(newOffer._id).populate({
        path: "owner",
        select: "account.username account.avatar _id",
      });
      // console.log(newOffer);
      return res.status(201).json(populateOffer);
    } catch (error) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put(
  "/offer/update/:id",
  isAuthenticated,
  fileUpload(),
  convertToBase64,
  async (req, res) => {
    try {
      const offerId = req.params.id;
      const { title, description, price } = req.body;

      // Vérifier si l'offre existe
      const offer = await Offer.findById(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }
      if (offer.owner.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Unauthorized to update this offer" });
      }

      // Mettre à jour les champs seulement s'ils sont fournis
      if (title !== undefined) offer.product_name = title;
      if (description !== undefined) offer.product_description = description;
      if (price !== undefined) {
        const priceNum = Number(price);
        if (isNaN(priceNum) || priceNum < 0 || priceNum >= 100000) {
          return res.status(400).json({
            message: "le prix doit être compris entre 0 et 100000",
          });
        }
        offer.product_price = priceNum;
      }
      const detailsMap = {
        brand: "MARQUE",
        size: "TAILLE",
        condition: "ETAT",
        couleur: "COULEUR",
        city: "EMPLACEMENT",
      };

      Object.entries(detailsMap).forEach(([fieldName, detailKey]) => {
        if (req.body[fieldName] !== undefined) {
          const existingDetail = offer.product_details.find(
            (detail) => Object.keys(detail)[0] === detailKey
          );
          if (existingDetail) {
            existingDetail[detailKey] = req.body[fieldName];
          } else {
            offer.product_details.push({ [detailKey]: req.body[fieldName] });
          }
        }
      });
      // Validation pour la description et le titre seulement s'ils sont fournis
      if (description !== undefined && description.length > 500) {
        return res.status(400).json({
          message: "La description ne doit pas dépasser 500 caractères",
        });
      }
      if (title !== undefined && title.length > 50) {
        return res.status(400).json({
          message: "Le titre ne doit pas dépasser 50 caractères",
        });
      }

      // Si une nouvelle image est uploadée
      if (!req.files || !req.files.picture) {
        return res
          .status(400)
          .json({ error: "Une image est obligatoire pour publier une offre" });
      }
      if (req.files && req.files.picture) {
        const result = await cloudinary.uploader.upload(
          req.files.picture.base64,
          {
            folder: `vinted/offers/${offer._id}`,
            public_id: "product_image",
          }
        );

        offer.product_picture = {
          secure_url: result.secure_url,
          public_id: result.public_id,
        };
      }
      if (req.files && req.files.pictures) {
        const pictures = Array.isArray(req.files.pictures)
          ? req.files.pictures
          : [req.files.pictures];

        const maxPictures = Math.min(pictures.length, 5);

        for (let i = 0; i < maxPictures; i++) {
          const uploadResponse = await cloudinary.uploader.upload(
            pictures[i].base64,
            {
              folder: `vinted/offers/${offer._id}`,
              public_id: `additional_image_${i}`,
            }
          );
          offer.product_pictures_add.push({
            secure_url: uploadResponse.secure_url,
            public_id: uploadResponse.public_id,
          });
        }
      }
      offer.markModified("product_details");
      await offer.save();
      return res.status(200).json(offer);
    } catch (error) {
      console.error("Error updating offer:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    const offerId = req.params.id;
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({ error: "Offer not found" });
    }

    // Vérifier si l'utilisateur est le propriétaire de l'offre
    if (offer.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this offer" });
    }
    // Supprimer l'offre de la base de données
    await Offer.deleteOne({ _id: offerId });
    // Supprimer l'image de Cloudinary
    await cloudinary.uploader.destroy(
      `vinted/offers/${offerId}/product_image`,
      {
        invalidate: true,
      }
    );
    return res.status(200).json({ message: "Offer deleted successfully" });
  } catch (error) {
    console.error("Error deleting offer:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
