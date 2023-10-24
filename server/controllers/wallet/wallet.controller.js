const {
  setWalletPin, 
  fundWallet, 
  verifyWalletFunding, 
  transferFund, 
  withdrawFund, 
  getWalletBalance, 
  getBanks
} = require("../../services/wallet/wallet.service")
const httpStatus = require("http-status");
const { validationResult } = require("express-validator");
const catchAsync = require("../../utils/catchasync");
const BadRequestError = require("../../utils/errors/badrequest.error");

const createWalletPin = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, errors: errors.array() });
  }

  const { pin } = req.body;

  const walletData = {
    pin,
    user: req.user,
  };

  await setWalletPin(walletData);

  return res.status(httpStatus.CREATED).send({
    success: true,
    message: "Set pin successfully!",
  });
});

const createFundWallet = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, errors: errors.array() });
  }

  const { amount, frontend_base_url } = req.body;

  const walletData = {
    amount,
    user: req.user,
    frontend_base_url,
  };

  const paymentLink = await fundWallet(walletData);

  return res.status(httpStatus.CREATED).send({
    success: true,
    message: "Initialized Wallet Funding",
    paymentLink,
  });
});

const createVerifyWalletFunding = catchAsync(async (req, res) => {
  const { transaction_id, status, tx_ref } = req.query;

  if (!transaction_id || !status || !tx_ref) {
    throw new BadRequestError("Could not verify payment");
  }

  const walletData = {
    transaction_id,
    status,
    tx_ref,
    user: req.user,
  };

  await verifyWalletFunding(walletData);

  return res.status(httpStatus.CREATED).send({
    success: true,
    message: "Wallet Funded Successfully",
  });
});

const createTransferFund = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, errors: errors.array() });
  }
  const { amount, wallet_code_or_email, wallet_pin } = req.body;

  const walletData = {
    amount,
    wallet_code_or_email,
    wallet_pin,
    user: req.user,
  };

  await transferFund(walletData);

  return res.status(httpStatus.CREATED).send({
    success: true,
    message: "Fund Transfer Successful",
  });
});

const createWithdrawFund = catchAsync(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(httpStatus.BAD_REQUEST).json({ success: false, errors: errors.array() });
  }
  const { amount, bank_code, account_number, wallet_pin } = req.body;

  const walletData = {
    amount,
    bank_code,
    account_number,
    wallet_pin,
    user: req.user,
  };

  await withdrawFund(walletData);

  return res.status(httpStatus.CREATED).send({
    success: true,
    message: "Withdrawal Successful",
  });
});

const createGetWalletBalance = catchAsync(async (req, res) => {
  const walletData = {
    user: req.user,
  };

  const wallet = await getWalletBalance(walletData);

  return res.status(httpStatus.OK).send({
    success: true,
    message: "Returned wallet balance successfully",
    result: wallet.balance,
  });
});

const createGetBanks = catchAsync(async (req, res) => {
  const banks = await getBanks();

  return res.status(httpStatus.OK).send({
    success: true,
    message: "Returned banks successfully",
    result: banks,
  });
});

module.exports = {
  createWalletPin,
  createFundWallet,
  createVerifyWalletFunding,
  createTransferFund,
  createWithdrawFund,
  createGetWalletBalance,
  createGetBanks,
};
