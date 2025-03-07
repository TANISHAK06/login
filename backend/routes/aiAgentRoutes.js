const express = require("express");
const router = express.Router();
const roleMiddleware = require("../middleware/authMiddleware");
const { mockOAuthLogin } = require("../controllers/aiAgentController");

router.get("/ai/student", roleMiddleware(["student"]), mockOAuthLogin);
router.get("/ai/finance", roleMiddleware(["finance"]), mockOAuthLogin);
router.get("/ai/admission", roleMiddleware(["admission"]), mockOAuthLogin);

module.exports = router;
