import { Router } from 'express';
import {
  getPosts,
  getPostById,
  getPostsByUserId,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/postController';
import { authenticateUser, optionalAuth } from '../middleware/auth';
import { validateCreatePost, validateUUID } from '../middleware/validation';

const router = Router();

// Public routes
router.get('/', getPosts);
router.get('/:id', validateUUID, getPostById);
router.get('/user/:userId', validateUUID, getPostsByUserId);

// Protected routes (require authentication)
router.post('/', authenticateUser, validateCreatePost, createPost);
router.put('/:id', authenticateUser, validateUUID, updatePost);
router.delete('/:id', authenticateUser, validateUUID, deletePost);

export default router;
