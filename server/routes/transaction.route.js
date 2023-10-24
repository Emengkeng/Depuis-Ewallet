const express = require("express");
const getTransactions = require("../controllers/transaction/transaction.controller");
const { auth } = require("../middlewares/auth");

const router = express.Router();
router.get("/transactions", [auth], getTransactions);

module.exports = router;
