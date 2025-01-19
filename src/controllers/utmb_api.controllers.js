import Fee from "../models/Fee";
import Sale from "../models/Sale";
import Race from "../models/Race";
import Users from "../models/Users";
import fetch from "node-fetch";

export const memberSimple = async (req, res) => {
  const { authToken } = req.body;
  var respuesta = "";

  const url = "https://api.utmb.world/users/dashboard/member/simple";

  await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authToken,
    },
  })
    .then((res) => (respuesta = res.text()))
    .then((response) => {
      const data = response;
      // console.log("data", data);
      res.send(data);
    });

  return respuesta;
};

export const localMemberSimple = async (authToken) => {
  var respuesta = "";

  const url = "https://api.utmb.world/users/dashboard/member/simple";

  await fetch(url, {
    method: "GET",
    headers: {
      Authorization: authToken,
    },
  })
    .then((res) => (respuesta = res.text()))
    .then((response) => {
      const data = response;
      // console.log("data", data);
      res.send(data);
    });

  return respuesta;
};

export const checkActiveStatus = async (req, res) => {
  const { email, firstName, lastName, dob } = req.body;
  var respuesta = "";

  const datos = {
    email: email,
    firstName: firstName,
    lastName: lastName,
    dob: dob,
  };

  const url = `https://api.utmb.world/registration/checkActiveStatus`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  })
    .then((res) => (respuesta = res.text()))
    .then((response) => {
      const data = response;
      // console.log("data", data);
      res.send(data);
    });

  return respuesta;
};

export const getTokenApi = async () => {
  var respuesta = "";
  const querystring = require("querystring");

  const datos = {
    username: "trailpunto@gmail.com",
    password: "Nolivera09!",
    client_id: "valholl",
    grant_type: "password",
  };

  const datosCodificados = querystring.stringify(datos);

  const url = `https://accounts.utmb.world/auth/realms/utmb-world/protocol/openid-connect/token`;

  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: datosCodificados,
  }).then((res) => (respuesta = res.json()));

  return respuesta;
};

export const registerRaceApi = async (token, body, raceID) => {
  var respuesta = "";
  const url = `https://api.utmb.world/registration/single/${raceID} `;

  // console.log(body);
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "x-tenant-id": "valholl",
    },
    body: JSON.stringify(body),
  }).then((res) => (respuesta = res.json()));

  return respuesta;
};

export const formatDate = (fecha) => {
  const dateString = fecha.toISOString()
  const fechaFormateada = dateString.split("T");
  return fechaFormateada[0];
};

export const Testeo = async (req, res) => {
  const { feeID, status } = req.body;
  const now = new Date();
  var respuesta = "";
  // const feeID = "64bc574dba8edd1300a219c7";

  //Obtengo toda la info de la cuota ingresada
  const feeInfo = await Fee.findById(feeID).exec();
  const feeSaleID = feeInfo.sale;

  console.log(feeInfo);

  //INFO VENTAS
  const saleInfo = await Sale.findById(feeSaleID).exec();
  const salePrice = saleInfo.price;
  const userIdSale = saleInfo.user;
  const raceIdSale = saleInfo.race;

  //INFO RACES
  const raceInfo = await Race.findById(raceIdSale).exec();
  const utmbRaceId = raceInfo.utmbRaceId;

  //USER INFO
  const userInfo = await Users.findById(userIdSale).exec();
  const userFirstname = userInfo.name;
  const userLastname = userInfo.lastname;
  const userBirthdate = formatDate(userInfo.birthdate);
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
    status: status, // CANCELLED
    fileNumber: feeID,
    grp: userTeam,
  };

  console.log(body);

  const { access_token } = await getTokenApi();

  respuesta = await registerRaceApi(access_token, body, utmbRaceId);

  if (respuesta.status === "OK") {
    return res
      .status(200)
      .json({ message: "Operación exitosa.", respuesta: respuesta });
  } else {
    return res.status(500).json({
      message: "Ha ocurrido un error en el proceso.",
      respuesta: respuesta,
    });
  }
};
