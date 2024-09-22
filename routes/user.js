const express = require("express");
const UserController = require("../controllers/users"); // Adjust the path to your UserController

const router = express.Router();

router.post("/register", UserController.addUser);
router.post("/login", UserController.loginUser);
router.get("/get/:id", UserController.getUser);
router.put("/edit/:id", UserController.editUser);
router.post("/forget-password", UserController.forgetPassword);
router.put("/change-password/:id", UserController.changePassword);

module.exports = router;
