import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import validator from "validator";
import Race from "./Race";

const userSchema = new Schema(
  {
    name: { type: String, required: true },
    lastname: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: [validator.isEmail, "Invalid email address."],
    },
    phone: {
      areaCode: { type: String, required: false },
      prefixNumber: { type: String, required: false },
      phoneNumber: { type: String, required: false },
    },
    refreshToken: {
      type: String,
    },
    refreshTokenExp: {
      type: Date,
    },
    nationality: { type: String, required: false },
    tokenExp: { type: Date, default: null },
    password: { type: String, trim: true, minlength: 7, required: false },
    location: {
      country: { type: String, required: false },
      province: { type: String, required: false },
      city: { type: String, required: false },
      postalCode: { type: String, required: false },
      address: {
        streetName: { type: String, required: false },
        streetNumber: { type: String, required: false },
        details: { type: String, required: false },
      },
    },
    alergic: {
      isAlergic: { type: Boolean, required: false },
      alergicDetail: { type: String, required: false },
    },
    emergencyContact: {
      contactName: { type: String, required: false },
      areaCode: { type: String, required: false },
      prefixNumber: { type: String, required: false },
      contactPhone: { type: String, required: false },
    },
    raceData: {
      discountCode: { type: String, required: false },
      discountedPrice: { type: Number, required: false },
      race: { type: Schema.Types.ObjectId, ref: "Race", required: false },
    },
    distance: { type: String, required: false },
    firstValhol: { type: Boolean, required: false },
    isCeliac: { type: Boolean, required: false },
    shirtSize: { type: String, required: false },
    insurance: { type: String, required: false },
    team: { type: String, required: false },
    gender: { type: String, enum: ["male", "female"] },
    document: { type: String, trim: true },
    role: [{ ref: "Role", type: Schema.Types.ObjectId }],
    resetToken: { type: String, default: null },
    resetTokenExp: { type: Date, default: null },
    birthdate: { type: Date, required: false },
    
    primeraCarrera: { type: String, required: false },
    primerViajeAlLugar: { type: String, required: false },
    diasAlojamiento: { type: String, required: false },
    comoLlegas: { type: String, required: false },
    personasNoParticipantes: { type: String, required: false },
    comoTeEnteraste: { type: String, required: false },
    carrerasAlAnio: { type: String, required: false },
    basesYCondiciones: { type: String, required: false },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  let user = this;
  let userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

userSchema.methods.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

userSchema.statics.isCorrectPassword = function (password, hashedPassword) {
  bcrypt.compare(password, hashedPassword);
};

export default model("User", userSchema);
