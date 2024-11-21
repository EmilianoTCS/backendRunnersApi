import Sale from "../models/Sale";
import Fee from "../models/Fee.js";
import { createFee } from "./fee.controllers.js";
import DiscountCode from "../models/DiscountCodes.js";
import mongoose from 'mongoose';
export const createSale = async (req, res) => {
  try {
    const {
      name,
      price,
      saleDate,
      feesAmount,
      description,
      user,
      race,
      discountCode = '', // Valor por defecto vacío
    } = req.body;

    // Validación de campos requeridos y tipos
    const validations = [
      { field: 'name', value: name, type: 'string' },
      { field: 'price', value: price, type: 'number' },
      { field: 'saleDate', value: saleDate, type: 'date' },
      { field: 'feesAmount', value: feesAmount, type: 'number', 
        min: 1, max: 3 },
      { field: 'user', value: user, type: 'objectId' },
      { field: 'race', value: race, type: 'objectId' }
    ];

    for (const validation of validations) {
      if (!validation.value) {
        return res.status(400).json({
          message: `El campo ${validation.field} es requerido`
        });
      }

      // Validaciones específicas por tipo
      switch (validation.type) {
        case 'number':
          if (typeof validation.value !== 'number' || isNaN(validation.value)) {
            return res.status(400).json({
              message: `El campo ${validation.field} debe ser un número válido`
            });
          }
          if (validation.min !== undefined && validation.value < validation.min) {
            return res.status(400).json({
              message: `El campo ${validation.field} debe ser mayor o igual a ${validation.min}`
            });
          }
          if (validation.max !== undefined && validation.value > validation.max) {
            return res.status(400).json({
              message: `El campo ${validation.field} debe ser menor o igual a ${validation.max}`
            });
          }
          break;
        case 'date':
          if (isNaN(Date.parse(validation.value))) {
            return res.status(400).json({
              message: `El campo ${validation.field} debe ser una fecha válida`
            });
          }
          break;
        case 'objectId':
          if (!mongoose.Types.ObjectId.isValid(validation.value)) {
            return res.status(400).json({
              message: `El campo ${validation.field} debe ser un ID válido`
            });
          }
          break;
      }
    }

    // Crear objeto base de la venta
    const saleData = {
      name,
      race,
      user,
      price,
      saleDate,
      feesAmount,
      discountCode
    };

    // Si hay código de descuento, verificar su validez
    if (discountCode.trim()) {
      const codeFound = await DiscountCode.findOne({ 
        discountCode: discountCode.trim() 
      }).select('limit');
      
      if (!codeFound) {
        return res.status(404).json({ 
          message: "Código de descuento no encontrado" 
        });
      }

      if (codeFound.limit <= 0) {
        return res.status(400).json({ 
          message: "Este código de descuento ya no se puede utilizar" 
        });
      }

      // Usar una transacción para la actualización del código y creación de la venta
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          // Actualizar límite del código de descuento
          await DiscountCode.findOneAndUpdate(
            { discountCode: discountCode.trim() },
            { $inc: { limit: -1 } },
            { session }
          );

          // Crear la venta
          const newSale = new Sale(saleData);
          const savedSale = await newSale.save({ session });

          // Crear las cuotas
          await createFee(feesAmount, savedSale._id, price, description, name);

          return res.status(201).json({ savedSale });
        });
      } finally {
        await session.endSession();
      }
    } else {
      // Crear venta sin código de descuento
      const newSale = new Sale(saleData);
      const savedSale = await newSale.save();

      // Crear las cuotas
      await createFee(feesAmount, savedSale._id, price, description, name);

      return res.status(201).json({ savedSale });
    }
    
  } catch (error) {
    console.error('Error en createSale:', error);
    return res.status(500).json({ 
      message: "Error al procesar la venta",
      error: error.message 
    });
  }
};
// Obtengo el listado de compras
export const getSales = async (req, res) => {
  let body = req.body;
  const { userID, raceID } = body;
  if (userID === "" && raceID === "") {
    try {
      const sales = await Sale.find();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } else if (userID !== "" && raceID === "") {
    try {
      const sales = await Sale.find({ user: userID });
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } else if (userID === "" && raceID !== "") {
    try {
      const sales = await Sale.find({ race: raceID });
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  } else if (userID !== "" && raceID !== "") {
    try {
      const sales = await Sale.find({ race: raceID, user: userID });
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }
};

export const updateSaleAndFees = async (req, res) => {
  try {
    const { user, price, race } = req.body;

    // Validar que todos los campos necesarios estén presentes
    if (!user || !price || !race) {
      return res.status(400).json({
        success: false,
        message: "Se requieren todos los campos: user, price y race",
      });
    }

    // Primero actualizamos la venta
    const updatedSale = await Sale.findOneAndUpdate(
      { _id: req.params.saleId },
      {
        $set: {
          user: user,
          price: price,
          race: race,
        },
      },
      { new: true } // Para obtener el documento actualizado
    );

    if (!updatedSale) {
      return res.status(404).json({
        success: false,
        message: "Venta no encontrada",
      });
    }

    // Ahora actualizamos todas las cuotas asociadas a esta venta
    const updatedFees = await Fee.updateMany(
      { sale: req.params.saleId },
      {
        $set: {
          feePrice: price / updatedSale.feesAmount, // Dividimos el nuevo precio entre la cantidad de cuotas
        },
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        sale: updatedSale,
        feesUpdated: updatedFees.modifiedCount,
      },
      message: "Venta y cuotas actualizadas correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar venta y cuotas:", error);
    return res.status(500).json({
      success: false,
      message: "Error al actualizar la venta y las cuotas",
      error: error.message,
    });
  }
};
