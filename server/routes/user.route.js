const express = require("express");
const {
    register,
    login,
    getProfile,
    getAllusers,
} = require("../controllers/user/user.controller");
const { userValidation } = require("../validations");
const { auth, authAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/register", [userValidation.register], register);
router.post("/login", [userValidation.login], login);
router.get("/auth/profile", [auth], getProfile);
router.get("/getallusers", [auth, authAdmin], getAllusers);

module.exports = router;
