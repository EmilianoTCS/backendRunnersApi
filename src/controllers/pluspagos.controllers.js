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

  const SECRET_KEY = process.env.SECRET_KEY_MACRO;
  //hola
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

//Función que se ejecuta después de realizar el pago del link generado anteriormente, recibe el body enviado por el script de MP y el ID de la cuota.
export const SuccessfullPayment = async (req, res) => {
  const { feeID } = req.body;
  try {
    //Establezco los filtros y los parámetros a actualizar
    const filterActual = { _id: feeID };
    const updateActual = { isActive: false, isPayed: true };

    await Fee.findOneAndUpdate(filterActual, updateActual, { new: true });

    res.status(200).json({ message: "Operación exitosa." });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
};
