import express from "express";
import { requireAuth } from "./auth.js";
import controllers from "../controllers/index.js";
import { validateBody, validateQuery } from "../middleware/validation.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { nlToSqlSchema } from "../validation/schemas.js";
import paginationMiddleware from "../middleware/pagination.js";

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/ai/nl-to-sql - Process natural language to SQL query using LangChain
router.post("/nl-to-sql", validateBody(nlToSqlSchema), asyncHandler(controllers.ai.nlToSql));

// GET /api/ai/nl-to-sql/health - Health check for NL-to-SQL functionality
router.get("/nl-to-sql/health", asyncHandler(controllers.ai.nlToSqlHealth));

export default router;
