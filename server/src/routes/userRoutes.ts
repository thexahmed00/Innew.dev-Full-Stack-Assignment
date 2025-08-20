import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserSubscription,
} from "../controllers/userController";
import { authenticateUser } from "../middleware/auth";
import { validateCreateUser, validateUUID } from "../middleware/validation";

const router = Router();

// Public routes
router.get("/", getUsers);

// Protected routes (require authentication)
// IMPORTANT: define static path before dynamic ":id" to avoid conflicts
router.get("/subscription", authenticateUser, getUserSubscription);
router.post("/", validateCreateUser, createUser);
router.put("/:id", authenticateUser, validateUUID, updateUser);
router.delete("/:id", authenticateUser, validateUUID, deleteUser);

// Dynamic route must come last to not catch /subscription
router.get("/:id", validateUUID, getUserById);

export default router;
