import User from "../models/Users";
import bcrypt from "bcrypt";
import config from "../config";
import jwt from "jsonwebtoken";
import Role from "../models/Role";
import nodemailer from "nodemailer";
import crypto from "crypto";
import RegisterData from "../models/RegisterData";

export const userRegister = async (req, res) => {
  let body = req.body;
  let {
    name,
    lastname,
    email,
    password,
    gender,
    location,
    role,
    primeraCarrera,
    primerViajeAlLugar,
    diasAlojamiento,
    comoLlegas,
    personasNoParticipantes,
    comoTeEnteraste,
    carrerasAlAnio,
    basesYCondiciones,
  } = body;
  try {
    // Verificar si el correo electrónico ya está registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(404).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      lastname,
      email,
      password: hashedPassword,
      gender,
      location,
      role,
      primeraCarrera,
      primerViajeAlLugar,
      diasAlojamiento,
      comoLlegas,
      personasNoParticipantes,
      comoTeEnteraste,
      carrerasAlAnio,
      basesYCondiciones,
    });
    if (role) {
      const foundRoles = await Role.find({ name: { $in: role } });
      newUser.role = foundRoles.map((role) => role._id);
    } else {
      const role = await Role.findOne({ name: "user" });
      newUser.role = [role._id];
    }

    const savedUser = await newUser.save();
    await RegisterData.updateOne(
      {},
      { $inc: { registeredUsers: 1 } },
      { upsert: true }
    );
    const token = jwt.sign(
      { id: savedUser?._id },
      process.env.SECRET || config.SECRET,
      {
        expiresIn: 43200, // 12 horas
      }
    );
    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// -------- login

export const userLogin = async (req, res) => {
  // const { email, password, tokenParsed } = req.body;
  const { tknUTMB } = req.body;

  // const tkn = JSON.parse(token);
  const { email } = tknUTMB;
  // const { email } = JSON.parse(tknUTMB);

  console.log("email", email, "tknUTMB", tknUTMB);
  const userFound = await User.findOne({ email }).populate("role");
  if (!userFound) return res.status(404).json({ message: "User not found" });

  // const matchPassword = await bcrypt.compare(password, userFound.password);

  // if (!matchPassword) {
  //   return res.status(404).json({ token: null, message: "Invalid password" });
  // }

  // console.log("tknParsed", tokenParsed, "email", email);
  if (!userFound) return res.status(404).json({ message: "User not found" });

  const token = jwt.sign(
    { id: userFound._id },
    process.env.SECRET || config.SECRET,
    {
      expiresIn: 43200,
    }
  );
  const now = new Date();
  const tokenExp = now.setHours(now.getHours() + 48);
  await userFound.updateOne({ tokenExp }); // guardar la fecha de expiración en el campo tokenExp

  const refreshToken = jwt.sign(
    { id: userFound._id },
    process.env.REFRESH_SECRET || config.REFRESH_SECRET,
    {
      expiresIn: 1296000, // 15 días
    }
  );

  res.status(200).json({
    token,
    refreshToken,
    email,
    id: userFound._id,
    name: userFound.name,
    lastname: userFound.lastname,
    role: userFound.role,
    document: userFound.document,
    location: userFound.location,
    gender: userFound.gender,
    insurance: userFound.insurance,
    shirtSize: userFound.shirtSize,
    phoneNumber: userFound.phoneNumber,
    emergencyContact: userFound.emergencyContact,
    isCeliac: userFound.isCeliac,
    alergic: userFound.alergic,
    primeraCarrera: userFound.primeraCarrera,
    primerViajeAlLugar: userFound.primerViajeAlLugar,
    diasAlojamiento: userFound.diasAlojamiento,
    comoLlegas: userFound.comoLlegas,
    personasNoParticipantes: userFound.personasNoParticipantes,
    comoTeEnteraste: userFound.comoTeEnteraste,
    carrerasAlAnio: userFound.carrerasAlAnio,
    basesYCondiciones: userFound.basesYCondiciones,
  });
};

const UpdateDataFromUser = async (data) => {
  const {
    document,
    location,
    gender,
    insurance,
    shirtSize,
    nationality,
    phoneNumber,
    emergencyContact,
    isCeliac,
    alergic,
    firstValhol,
    distance,
    team,
    birthdate,
    primeraCarrera,
    primerViajeAlLugar,
    diasAlojamiento,
    comoLlegas,
    personasNoParticipantes,
    comoTeEnteraste,
    carrerasAlAnio,
    basesYCondiciones,
  } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { _id: data._id },
      {
        document,
        location,
        gender,
        insurance,
        shirtSize,
        nationality,
        phoneNumber,
        emergencyContact,
        isCeliac,
        alergic,
        firstValhol,
        distance,
        team,
        birthdate,
        primeraCarrera,
        primerViajeAlLugar,
        diasAlojamiento,
        comoLlegas,
        personasNoParticipantes,
        comoTeEnteraste,
        carrerasAlAnio,
        basesYCondiciones,
      },
      { new: true } // para que devuelva el usuario actualizado en vez del anterior
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const newUserRegister = async (data) => {
  let {
    name,
    lastname,
    email,
    password,
    gender,
    location,
    role,
    primeraCarrera,
    primerViajeAlLugar,
    diasAlojamiento,
    comoLlegas,
    personasNoParticipantes,
    comoTeEnteraste,
    carrerasAlAnio,
    basesYCondiciones,
  } = data;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({
      name,
      lastname,
      email,
      password: hashedPassword,
      gender,
      location,
      role,
      primeraCarrera,
      primerViajeAlLugar,
      diasAlojamiento,
      comoLlegas,
      personasNoParticipantes,
      comoTeEnteraste,
      carrerasAlAnio,
      basesYCondiciones,
    });
    if (role) {
      const foundRoles = await Role.find({ name: { $in: role } });
      newUser.role = foundRoles.map((role) => role._id);
    } else {
      const role = await Role.findOne({ name: "user" });
      newUser.role = [role._id];
    }

    const savedUser = await newUser.save();
    await RegisterData.updateOne(
      {},
      { $inc: { registeredUsers: 1 } },
      { upsert: true }
    );
    const token = jwt.sign(
      { id: savedUser?._id },
      process.env.SECRET || config.SECRET,
      {
        expiresIn: 43200, // 12 horas
      }
    );
    res.json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ----------------------

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // verifica si el refreshToken es válido
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET || config.REFRESH_SECRET
    );
    const userId = decoded.id;

    // busca el usuario en la base de datos
    const userFound = await User.findById(userId);

    if (!userFound) {
      throw new Error("User not found");
    }

    // verifica si el refreshToken ha expirado
    const now = new Date();
    const refreshTokenExp = new Date(userFound.refreshTokenExp);
    if (now > refreshTokenExp) {
      throw new Error("Refresh token expired");
    }

    // genera un nuevo token de acceso y refreshToken
    const token = jwt.sign(
      { id: userFound._id },
      process.env.SECRET || config.SECRET,
      {
        expiresIn: 43200, // 12 horas
      }
    );
    const newRefreshToken = jwt.sign(
      { id: userFound._id },
      process.env.REFRESH_SECRET || config.REFRESH_SECRET,
      {
        expiresIn: 1296000, // 15 días
      }
    );
    const newRefreshTokenExp = new Date(
      now.getTime() + 14 * 24 * 60 * 60 * 1000
    ); // 14 días
    userFound.refreshToken = newRefreshToken;
    userFound.refreshTokenExp = newRefreshTokenExp;
    await userFound.save();

    res.json({ token, refreshToken: newRefreshToken });
  } catch (error) {
    console.error(`No se pudo refrescar el token: ${error.message}`);
    res.status(401).json({ message: "No se pudo refrescar el token" });
  }
};

export const editDataFromUser = async (req, res) => {
  const {
    document,
    location,
    gender,
    insurance,
    shirtSize,
    nationality,
    phoneNumber,
    emergencyContact,
    isCeliac,
    alergic,
    firstValhol,
    distance,
    team,
    birthdate,
    primeraCarrera,
    primerViajeAlLugar,
    diasAlojamiento,
    comoLlegas,
    personasNoParticipantes,
    comoTeEnteraste,
    carrerasAlAnio,
    basesYCondiciones,
  } = req.body;
  const userId = req.params.id; // se pasa el ID del usuario como parámetro en la URL

  try {
    const user = await User.findOneAndUpdate(
      { _id: userId },
      {
        document,
        location,
        gender,
        insurance,
        shirtSize,
        nationality,
        phoneNumber,
        emergencyContact,
        isCeliac,
        alergic,
        firstValhol,
        distance,
        team,
        birthdate,
        primeraCarrera,
        primerViajeAlLugar,
        diasAlojamiento,
        comoLlegas,
        personasNoParticipantes,
        comoTeEnteraste,
        carrerasAlAnio,
        basesYCondiciones,
      },
      { new: true } // para que devuelva el usuario actualizado en vez del anterior
    );
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const userId = req.params.id; // se pasa el ID del usuario como parámetro en la URL

  try {
    const deletedUser = await User.findOneAndDelete({ _id: userId });
    res.json(deletedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Buscar el usuario por su dirección de correo electrónico
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generar un token de restablecimiento de contraseña
    const resetToken = crypto.randomBytes(6).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExp = Date.now() + 600000; // Caduca en 10 minutos

    // Guardar el token de restablecimiento en el usuario
    await user.save();

    // Enviar correo electrónico de restablecimiento de contraseña
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: "puntotrail.noreply@gmail.com",
        pass: "lqbfqanpanmbglby",
      },
    });

    const mailOptions = {
      from: "puntotrail.noreply@gmail.com",
      to: email,
      subject: "Recuperación de contraseña",
      text: `Para restablecer tu contraseña, copia el siguiente token. Ten en cuenta que expirará en 10 minutos: ${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Correo electrónico enviado: " + info.response);
        return res.json({ message: "Email sent successfully" });
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const enterResetToken = async (req, res) => {
  const { resetToken } = req.body;
  try {
    // Buscar el usuario por el token de restablecimiento de contraseña
    const user = await User.findOne({
      resetToken,
      resetTokenExp: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Si el token es válido, devuelve una respuesta exitosa o redirige a una página donde el usuario pueda ingresar su nueva contraseña
    res.json({ message: "Valid token" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resetPassword = async (req, res) => {
  const { newPassword } = req.body;
  const { email } = req.body; // Obtener el correo electrónico del usuario autenticado desde la solicitud

  try {
    // Buscar el usuario por su dirección de correo electrónico
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Actualizar la contraseña del usuario
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;

    // Limpiar el token de restablecimiento de contraseña
    user.resetToken = undefined;
    user.resetTokenExp = undefined;

    // Guardar el usuario actualizado en la base de datos
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};
