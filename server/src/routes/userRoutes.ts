import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController";
import { authenticateUser } from "../middleware/auth";
import { validateCreateUser, validateUUID } from "../middleware/validation";

const router = Router();

// Public routes
router.get("/", getUsers);
router.get("/:id", validateUUID, getUserById);

// Protected routes (require authentication)
router.post("/", validateCreateUser, createUser);
router.put("/:id", authenticateUser, validateUUID, updateUser);
router.delete("/:id", authenticateUser, validateUUID, deleteUser);

export default router;
