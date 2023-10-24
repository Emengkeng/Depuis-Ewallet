const express = require("express");
const {getTransaction} = require("../controllers/transaction/transaction.controller");
const { auth } = require("../middlewares/auth/auth");
const {authAdmin} = require("../middlewares/auth/auth-admin");

const router = express.Router();
router.get("/transactions", [auth], getTransaction);

module.exports = router;
