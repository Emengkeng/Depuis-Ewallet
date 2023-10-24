const express = require("express");
const userController = require("../controllers/user.controller");
const { userValidation } = require("../validations");
const { auth, authAdmin } = require("../middlewares");

const router = express.Router();

router.post("/register", userValidation.register, userController.register);
router.post("/login", userValidation.login, userController.login);
router.get("/auth/profile", [auth], userController.getProfile);
router.get("/getallusers", [auth, authAdmin], userController.getAllusers);

module.exports = router;
