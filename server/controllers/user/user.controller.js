const {createWallet} = require("../../services/card/creatcard.service")
const {createUser, createProfile, findUserByEmail, getProfile} = require("../../services/user/user.service")
const httpStatus = require("http-status");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
import model from '../../models';
const jwt = require("jsonwebtoken");
const jwtConfig = require("../../config/jwt");
const catchAsync = require("../../utils/catchasync");
const UnAuthorizedError = require("../../utils/errors/unauthorized.error");

const register = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, errors: errors.array() });
  }
  const user = await createUser(req.body);

  await createWallet(user.id);
  await createProfile(user.id, user.first_name);

  return res.status(httpStatus.CREATED).send({
    success: true,
    message: "Registered successfully!",
  });
});

const login = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, errors: errors.array() });
  }
  const { email, password } = req.body;
  const user = await findUserByEmail(email);

  if (!user) {
    throw new UnAuthorizedError("Invalid email or password");
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new UnAuthorizedError("Invalid email or password");
  }

  const payload = {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
  };

  const token = jwt.sign(payload, jwtConfig.appKey, {
    expiresIn: "1h",
  });

  return res.status(httpStatus.OK).send({
    success: true,
    message: "Logged in successfully!",
    results: payload,
    token,
  });
});

const getProfiles = catchAsync(async (req, res) => {
  const user = await getProfile(req.user);

  return res.status(httpStatus.OK).send({
    success: true,
    message: "Returned profile successfully",
    result: user,
  });
});

const getAllusers = catchAsync(async (req, res) => {
  const data = await model.Users.findAll({
    include: [model.Wallets], //, model.Profiles, model.Cards, model.CardTypes
  });
  return res.status(httpStatus.OK).send({
    success: true,
    message: 'List of all Users',
    result: data,
  });
})

module.exports = {
  register,
  login,
  getProfiles,
  getAllusers,
};
