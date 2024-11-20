import DiscountCode from "../models/DiscountCodes";
import Race from "../models/Race";
import User from "../models/Users";

export const generateDiscountCodes = async (req, res) => {
  const { quantity, discountPercentage } = req.body;
  const codeLength = 5;

  try {
    const codes = [];
    for (let i = 0; i < quantity; i++) {
      const code = generateDiscountCode(codeLength);
      const discountCode = new DiscountCode({
        code: code,
        discount: discountPercentage,
      });
      const savedDiscountCode = await discountCode.save();
      codes.push(savedDiscountCode);
    }
    res.status(200).json(codes);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const createNewDiscountCode = async (req, res) => {
  let body = req.body;
  const { name, discountAmount, limit } = body; // Se obtienen los datos de la carrera del cuerpo de la solicitud

  try {
    const newDiscountCode = new DiscountCode({
      name,
      discountAmount,
      limit,
    });

    const savedDiscountCode = await newDiscountCode.save(); //Si todo esta bien, creo el nuevo registro

    //Devuelvo la respuesta
    res.status(201).json({ savedDiscountCode });
  } catch (error) {
    // Manejo del error
    res.status(400).json({ message: error.message });
  }
};

const generateDiscountCode = (length) => {
  const characters =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters.charAt(randomIndex);
  }
  return code;
};

export const applyDiscountCode = async (req, res) => {
  const raceId = req.params.id;
  const { code } = req.body;

  try {
    const user = await User.findOne({ _id: req.userId });
    const race = await Race.findOne({ _id: raceId });
    if (!race) {
      return res.status(404).json({ message: "Carrera no encontrada" });
    }

    const discountCode = await DiscountCode.findOne({ code: code });
    if (discountCode) {
      const discountPercentage = discountCode.discount;
      const originalPrice = race.info.price;
      const discountedPrice =
        originalPrice - (originalPrice * discountPercentage) / 100;
      // Asocia el código de descuento al usuario y al precio con descuento
      user.raceData.discountCode = code;
      user.raceData.discountedPrice = discountedPrice;
      await user.save();

      res.status(200).json({
        message: "Descuento aplicado correctamente",
        price: discountedPrice,
      });
    } else {
      res.status(404).json({ message: "Código de descuento inválido" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getDiscountCodeDetails = async (req, res) => {
  const code = req.params.code;

  try {
    const discountCode = await DiscountCode.findOne({ code });

    if (discountCode) {
      res.status(200).json(discountCode);
    } else {
      res.status(404).json({ message: "Código de descuento no encontrado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getAllDiscountCodes = async (req, res) => {
  try {
    const discountCodes = await DiscountCode.find();
    res.status(200).json(discountCodes);
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
