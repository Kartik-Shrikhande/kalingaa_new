const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/login", authController.login);
router.post("/refresh-token", authMiddleware.refreshToken);
router.post("/verify", authMiddleware.authenticateUser, authMiddleware.verifyToken);
module.exports = router;
   
