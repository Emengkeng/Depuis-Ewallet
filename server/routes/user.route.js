const express = require("express");
const {
    register,
    login,
    getProfiles,
    getAllusers,
} = require("../controllers/user/user.controller");
const { userValidation } = require("../validations");
const { auth } = require("../middlewares/auth/auth");
const {authAdmin} = require("../middlewares/auth/auth-admin");

const router = express.Router();

router.post("/register", [userValidation.register], register);
router.post("/login", [userValidation.login], login);
router.get("/auth/profile", [auth], getProfiles);
router.get("/getallusers", [auth, authAdmin], getAllusers);

module.exports = router;
