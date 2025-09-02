const convertToBase64 = (req, res, next) => {
  try {
    // Fonction utilitaire pour convertir un fichier en base64
    const fileToBase64 = (file) => {
      return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
    };

    // Si des fichiers sont présents, les convertir
    if (req.files) {
      // Convertir chaque fichier en base64
      for (const fieldName in req.files) {
        const file = req.files[fieldName];

        if (Array.isArray(file)) {
          // Si c'est un tableau de fichiers (plusieurs fichiers)
          req.files[fieldName] = file.map((singleFile) => ({
            ...singleFile,
            base64: fileToBase64(singleFile),
          }));
        } else {
          // Si c'est un seul fichier
          req.files[fieldName] = {
            ...file,
            base64: fileToBase64(file),
          };
        }
      }
    }

    next();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Erreur lors de la conversion base64" });
  }
};

module.exports = convertToBase64;
