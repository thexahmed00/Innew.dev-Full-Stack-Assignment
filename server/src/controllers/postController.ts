import { Request, Response } from "express";
import { PostModel } from "../models/Post";
import {
  sendSuccessResponse,
  sendErrorResponse,
  asyncHandler,
} from "../utils/errorHandler";
import { Post } from "../types";

// Get all posts
export const getPosts = asyncHandler(async (req: Request, res: Response) => {
  const posts = await PostModel.findAll();
  sendSuccessResponse(res, posts, "Posts retrieved successfully");
});

// Get post by ID
export const getPostById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const post = await PostModel.findById(id);
  if (!post) {
    sendErrorResponse(res, new Error("Post not found"), 404);
    return;
  }

  sendSuccessResponse(res, post, "Post retrieved successfully");
});

// Get posts by user ID
export const getPostsByUserId = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const posts = await PostModel.findByUserId(userId);
    sendSuccessResponse(res, posts, "User posts retrieved successfully");
  }
);

// Create new post
export const createPost = asyncHandler(async (req: Request, res: Response) => {
  const { title, content, user_id } = req.body;

  // Basic validation
  if (!title || !content || !user_id) {
    sendErrorResponse(
      res,
      new Error("Title, content, and user_id are required"),
      400
    );
    return;
  }

  const postData: Partial<Post> = {
    title,
    content,
    user_id,
  };

  const newPost = await PostModel.create(postData);
  sendSuccessResponse(res, newPost, "Post created successfully", 201);
});

// Update post
export const updatePost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;

  const postData: Partial<Post> = {};
  if (title) postData.title = title;
  if (content) postData.content = content;

  const updatedPost = await PostModel.update(id, postData);
  if (!updatedPost) {
    sendErrorResponse(res, new Error("Post not found"), 404);
    return;
  }

  sendSuccessResponse(res, updatedPost, "Post updated successfully");
});

// Delete post
export const deletePost = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const deleted = await PostModel.delete(id);
  if (!deleted) {
    sendErrorResponse(res, new Error("Post not found"), 404);
    return;
  }

  sendSuccessResponse(res, null, "Post deleted successfully");
});
