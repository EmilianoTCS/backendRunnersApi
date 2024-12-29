const { encryptString } = require("pluspagos-aes-encryption");

export const payProduct = async (req, res) => {
  const {
    callbackSuccess,
    callbackCancel,
    sucursalComercio,
    monto,
    producto,
    comercio,
  } = req.body;

  try {
    // Encriptar los datos usando la librería
    const encryptedData = {
      callbackSuccess: encryptString(callbackSuccess, SECRET_KEY),
      callbackCancel: encryptString(callbackCancel, SECRET_KEY),
      sucursalComercio: encryptString(sucursalComercio, SECRET_KEY),
      monto: encryptString(monto, SECRET_KEY),
      TransaccionComercioId: Math.floor(Math.random() * (10000 - 1 + 1)) + 1,
      comercio: comercio,
      producto: producto,
    };

    // Enviar los datos encriptados al cliente
    res.status(200).json(encryptedData);
  } catch (error) {
    console.error("Error encrypting data:", error);
    res.status(500).send("Error encrypting data");
  }
};
