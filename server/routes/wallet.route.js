const express = require("express");
const {
    setWalletPin,
    fundWallet,
    transferFund,
    withdrawFund,
    getWalletBalance,
    getBanks,
} = require("../controllers/wallet/wallet.controller");
const { walletValidation } = require('../validations');
const { auth } = require("../middlewares/auth/");
const { setWalletPin } = require("../middlewares/wallet/set-wallet-pin");

const router = express.Router();

router.post("/wallet/set-pin", 
    [auth, 
    walletValidation.setWalletPin], 
    setWalletPin);

router.post("/wallet/fund", 
    [auth, setWalletPin, 
    walletValidation.fundWallet], 
    fundWallet);

router.get("/wallet/verify", 
    [auth], 
    verifyWalletFunding);

router.post("/wallet/transfer", 
    [auth, setWalletPin, 
    walletValidation.transferFund], 
    transferFund);

router.post("/wallet/withdraw", 
    [auth, setWalletPin, 
    walletValidation.withdrawFund], 
    withdrawFund);

router.get("/wallet/balance", 
    [auth], getWalletBalance);

router.get("/wallet/banks", 
    [auth], getBanks);

module.exports = router;
