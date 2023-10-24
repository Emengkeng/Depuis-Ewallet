const express = require("express");
const {
    createWalletPin,
    createFundWallet,
    createTransferFund,
    createWithdrawFund,
    createVerifyWalletFunding,
    createGetBanks,
    createGetWalletBalance,
} = require("../controllers/wallet/wallet.controller");
const { walletValidation } = require('../validations');
const { auth } = require("../middlewares/auth/auth");
const { setWalletPins } = require("../middlewares/wallet/set-wallet-pin");

const router = express.Router();

router.post("/wallet/set-pin", 
    [auth, 
    walletValidation.setWalletPin], 
    createWalletPin);

router.post("/wallet/fund", 
    [auth, setWalletPins, 
    walletValidation.fundWallet], 
    createFundWallet);

router.get("/wallet/verify", 
    [auth], 
    createVerifyWalletFunding);

router.post("/wallet/transfer", 
    [auth, setWalletPins, 
    walletValidation.transferFund], 
    createTransferFund);

router.post("/wallet/withdraw", 
    [auth, setWalletPins, 
    walletValidation.withdrawFund], 
    createWithdrawFund);

router.get("/wallet/balance", 
    [auth], createGetWalletBalance);

router.get("/wallet/banks", 
    [auth], createGetBanks);

module.exports = router;
