const mercadopago = require("mercadopago");
import Race from "../models/Race";
import RegisterData from "../models/RegisterData";
import DiscountCode from "../models/DiscountCodes";
import Fee from "../models/Fee";
import Sale from "../models/Sale";
import Users from "../models/Users";
import fetch from "node-fetch";

import {
  getTokenApi,
  registerRaceApi,
  localMemberSimple,
  formatDate
} from "./utmb_api.controllers";
mercadopago.configure({
  access_token: process.env.ACCESS_TOKEN,
});

export const payProduct = async (req, res) => {
  const raceId = req.params.id; // se pasa el ID de la carrera como parámetro en la URL
  const { discountCode, price, successUrl, failureUrl, pendingUrl } = req.body;

  try {
    // Obtener la información del producto desde la base de datos
    const product = await Race.findById(raceId);

    // Verificar si el producto está disponible y tiene un precio
    if (!product.info.available || !product.info.price) {
      throw new Error("El producto no está disponible para la compra");
    }

    // Crear el objeto de preferencia de pago
    const preference = {
      items: [
        {
          title: product.name,
          description: product.description,
          unit_price: price,
          quantity: 1,
        },
      ],
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: "approved",
    };

    // Crear la preferencia de pago en Mercado Pago
    const response = await mercadopago.preferences.create(preference);

    // Obtener el link de pago generado
    const paymentLink = response.body.init_point;

    // Obtener la distancia de la carrera en kilómetros
    const distance = parseInt(product.info.distance);

    // Actualizar la estadística de usuarios pagados por kilómetro
    await RegisterData.updateOne(
      {},
      { $inc: { [`registeredPayments.${distance}`]: 1 } }
    );

    discountCode &&
      (await DiscountCode.findOneAndDelete({ code: discountCode }));

    // Retornar el link de pago
    res.send(paymentLink);
  } catch (error) {
    console.error("Error al generar el pago:", error);
    throw error;
  }
};

//Generador de links de pago, recibe el ID de la cuota a pagar como parámetro
export const payFee = async (req, res) => {
  let body = req.body;
  const { feeID } = body;
  const fee = await Fee.findOne({ _id: feeID }).exec(); //Obtengo toda la información de la cuota ingresada
  try {
    var now = new Date(); //fecha actual
    var expireDate = new Date(fee.expireDate); //fecha de vencimiento de la cuota
    var expireDateLink =
      fee.linkGeneratedDate === null
        ? new Date()
        : new Date(fee.linkGeneratedDate); //fecha de vencimiento del link

    //Valido la fecha de vencimiento de la cuota
    if (now > expireDate) {
      await Fee.findOneAndUpdate(
        { _id: feeID },
        { isActive: false, isPayed: false },
        { new: true }
      );
      throw new Error("La cuota ha expirado.");

      //Valido la fecha de vencimiento del link generado
    } else if (now > expireDateLink) {
      await Fee.findOneAndUpdate(
        { _id: feeID },
        { linkGeneratedDate: null },
        { new: true }
      );
      throw new Error(
        "El link generado ha expirado, vuelve a realizar la solicitud."
      );
    } else {
      //Guardo la fecha de vencimiento del para el link que se va a generar
      var linkGeneratedDate = new Date();
      linkGeneratedDate.setDate(linkGeneratedDate.getDate() + 2);
      var json_linkExpireDate = linkGeneratedDate.toJSON();

      //Creo las preferencias para el script de MP.

      const preference = {
        items: [
          {
            title: `${fee.title}`,
            description: `${fee.description}`,
            unit_price: fee.feePrice,
            quantity: 1,
            category_id: "travels",
            currency_id: "ARS",
          },
        ],
        back_urls: {
          success: "https://www.puntotrail.com/finalizacion",
          failure: "https://www.puntotrail.com/inscription",
          pending: "https://www.puntotrail.com/inscription",
        },
        auto_return: "approved",
        notification_url: `https://backend-runners-api.vercel.app/api/payment/webhookMP/${feeID}`,
        date_of_expiration: json_linkExpireDate,
      };

      // Crear la preferencia de pago en Mercado Pago
      const response = await mercadopago.preferences.create(preference);

      // Obtener el link de pago generado
      const paymentLink = response.body.init_point;

      // Retornar el link de pago
      console.log(paymentLink);
      res.send(paymentLink);

      //Guardo al fecha de expiración del link en la BDD
      const filterActual = { _id: feeID };
      const updateActual = { linkGeneratedDate: linkGeneratedDate };
      await Fee.findOneAndUpdate(
        { _id: feeID },
        { linkGeneratedDate: linkGeneratedDate }
      );
    }
  } catch (error) {
    console.error("Error al generar el pago:", error);
    throw error;
  }
};

//Función que se ejecuta después de realizar el pago del link generado anteriormente, recibe el body enviado por el script de MP y el ID de la cuota.
export const receiveWebhook = async (req, res) => {
  const now = new Date();
  const payment = req.query;
  const feeID = req.params.feeID;

  //Obtengo toda la info de la cuota ingresada

  const feeInfo = await Fee.findById(feeID).exec();
  const feeSaleID = feeInfo.sale;
  const numFee = feeInfo.numFee;
  const feePrice = feeInfo.feePrice;

  //INFO VENTAS
  const saleInfo = await Sale.findById(feeSaleID).exec();
  const salePrice = saleInfo.price;
  const userIdSale = saleInfo.user;
  const raceIdSale = saleInfo.race;
  const userBirthdate = formatDate(userInfo.birthdate);


  //INFO RACES
  const raceInfo = await Race.findById(raceIdSale).exec();
  const utmbRaceId = raceInfo.utmbRaceId;

  //USER INFO
  const userInfo = await Users.findById(userIdSale).exec();
  const userFirstname = userInfo.name;
  const userLastname = userInfo.lastname;
  const userEmail = userInfo.email;
  const userNationality = userInfo.nationality;
  const userGender =
    userInfo.gender === "femenino"
      ? "F"
      : userInfo.gender === "masculino"
      ? "M"
      : "H";
  const userTeam = userInfo.team;

  var body = {
    firstName: userFirstname,
    lastName: userLastname,
    birthdate: userBirthdate,
    gender: userGender,
    email: userEmail,
    nationality: userNationality.substring(0, 3),
    registrationFee: 0,
    totalPaid: salePrice,
    currency: "ARS",
    urlDashboard: "",
    registrationDate: now.toISOString(),
    status: "REGISTERED", // CANCELLED
    fileNumber: feeID,
    grp: userTeam,
  };

  let successResponseSent = false; //Booleano auxiliar que indica el status 200 y si ya fue enviado

  try {
    //Si el pago fue correcto
    if (payment.type === "payment") {
      const data = await mercadopago.payment.findById(payment["data.id"]);

      //Establezco los filtros y los parámetros a actualizar
      if (data.body.status === "approved") {
        if (numFee === 3) {
          //INSERT O AVISO A API DE UMTB EL REGISTRO DE UNA CARRERA
          const { access_token } = await getTokenApi();

          if (access_token !== "") {
            const { birthdateIso } = await localMemberSimple(access_token);

            body.birthdate = birthdateIso;

            await registerRaceApi(access_token, body, utmbRaceId);
          }
        } else if (numFee === 1) {
          if (parseFloat(feePrice) === parseFloat(salePrice)) {
            //INSERT O AVISO A API DE UMTB EL REGISTRO DE UNA CARRERA
            const { access_token } = await getTokenApi();

            if (access_token !== "") {
              const { birthdateIso } = await localMemberSimple(access_token);
              body.birthdate = birthdateIso;

              await registerRaceApi(access_token, body, utmbRaceId);
            }
          }
        }

        //Establezco los filtros y los parámetros a actualizar
        const filterActual = { _id: feeID};
        const updateActual = { isActive: false, isPayed: true };
        //Cambio los valores de la cuota ingresada: isActive -> false (deshabilita el boton pagar), isPayed -> true (fue pagada.)
        await Fee.findOneAndUpdate(
          filterActual,
          updateActual,
          { new: true }
        );

        successResponseSent = true;
        res.status(200).json({ message: "Operación exitosa." });
      }

      if (!successResponseSent) {
        return res
          .sendStatus(400)
          .json({ error: "El pago no ha sido aprobado." });
      }
    }
  } catch (error) {
    console.log(error);
    return res.sendStatus(500).json({ error: error.message });
  }
};


