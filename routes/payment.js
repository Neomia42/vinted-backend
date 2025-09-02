const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
router.post("/payment", async (req, res) => {
  try {
    // Récupération des données depuis le frontend
    const { amount, title, productId } = req.body;

    // Validation des données
    if (!amount || !title) {
      return res.status(400).json({
        error: "Montant et titre du produit requis",
      });
    }

    // On crée une intention de paiement
    const paymentIntent = await stripe.paymentIntents.create({
      // Montant de la transaction (déjà en centimes depuis le front)
      amount: amount,
      // Devise de la transaction
      currency: "eur",
      // Description du produit
      description: `Achat Vinted: ${title}`,
      // Métadonnées pour le suivi
      metadata: {
        productId: productId || "",
        title: title,
      },
      // Méthodes de paiement automatiques
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // On renvoie le client_secret au frontend
    res.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Erreur création payment intent:", error);
    res.status(500).json({
      error: "Erreur lors de la création du paiement",
    });
  }
});

module.exports = router;
// Prix produit → Montant Stripe
