const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
// ? const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const { User } = require("../db/usersModel");
const {
  NoAuthorizedError,
  AuthConflictError,
  WrongBodyError,
  ValidationError,
} = require("../helpers/errors");
const { uploadDir, downloadDir } = require("../middlewares/uploadMiddleware");
require("dotenv").config();
const secret = process.env.SECRET;
const PORT = process.env.PORT;
const metaEmail = process.env.META_EMAIL;
const metaPassword = process.env.META_PASSWORD;

const patchUserSubscription = async (id, subscription) => {
  const user = await User.findById(id);
  if (!user) {
    throw new NoAuthorizedError("Not authorized");
  }
  await User.findByIdAndUpdate(id, { subscription });
  const userFind = await User.findById(id);
  return userFind;
};

const registration = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (user) {
    throw new AuthConflictError("Email is already in use");
  }

  const avatarURL = gravatar.url(email, {
    protocol: "http",
    s: "250",
  });
  const newUser = new User({ email, avatarURL });
  newUser.setPassword(password);
  const verificationToken = uuidv4();
  newUser.verificationToken = verificationToken;
  await newUser.save();

  // send email
  const config = {
    host: "smtp.meta.ua",
    port: 465,
    secure: true,
    auth: {
      user: metaEmail,
      pass: metaPassword,
    },
  };
  const transporter = nodemailer.createTransport(config);
  const emailOptions = {
    from: metaEmail,
    to: email,
    subject: "Verification email",
    html: `<strong>Please, verification your email address by this <a href="http://localhost:${PORT}/api/users/verify/${verificationToken}">link</a></strong>`,
  };
  await transporter.sendMail(emailOptions);
  const userFind = await User.findOne({ email }, { email: 1, subscription: 1 });
  return userFind;
};

const verificationUser = async (verificationToken) => {
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw new WrongBodyError("User not found");
  }
  user.verificationToken = "null";
  user.verify = true;
  await user.save();
};

const verifyRepite = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new WrongBodyError("User not found");
  }
  if (user.verify) {
    throw new ValidationError("Verification has already been passed");
  }
  const verificationToken = uuidv4();
  user.verificationToken = verificationToken;
  await user.save();

  // send email
  const config = {
    host: "smtp.meta.ua",
    port: 465,
    secure: true,
    auth: {
      user: metaEmail,
      pass: metaPassword,
    },
  };
  const transporter = nodemailer.createTransport(config);
  const emailOptions = {
    from: metaEmail,
    to: email,
    subject: "Verification email",
    html: `<strong>Please, verification your email address by this <a href="http://localhost:${PORT}/api/users/verify/${verificationToken}">link</a></strong>`,
  };
  await transporter.sendMail(emailOptions);
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.validPassword(password))) {
    throw new NoAuthorizedError("Email or password is wrong");
  }
  if (!user.verify) {
    throw new NoAuthorizedError("Your email is not verification");
  }
  const payload = {
    id: user._id,
    email: user.email,
    subscription: user.subscription,
  };
  const token = jwt.sign(payload, secret, { expiresIn: "1h" });
  await User.findOneAndUpdate({ email }, { token });
  const userFind = await User.findOne({ email }, { email: 1, subscription: 1 });
  return { token, userFind };
};

const logout = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new NoAuthorizedError("Not authorized");
  }
  await User.findByIdAndUpdate(id, { token: null });
};

const uploadUserAvatar = async (id, file) => {
  Jimp.read(`${uploadDir}/${file.filename}`, (err, avatar) => {
    if (err) {
      throw new NoAuthorizedError("Not authorized");
    }
    avatar
      .resize(250, 250) // resize
      .write(`${downloadDir}/${file.filename}`); // save
  });

  // ? delete old avatar out of ./tmp
  // fs.unlink(`${uploadDir}/${file.filename}`, (err) => {
  //   if (err) console.log(err);
  // });

  const avatarURL = path.resolve(`./public/avatars/${file.filename}`);
  await User.findOneAndUpdate({ _id: id }, { avatarURL });
  return avatarURL;
};

module.exports = {
  registration,
  login,
  logout,
  patchUserSubscription,
  uploadUserAvatar,
  verificationUser,
  verifyRepite,
};
