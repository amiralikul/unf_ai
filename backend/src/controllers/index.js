import { PrismaClient } from "@prisma/client";
import OpenAI from "openai";
import { TrelloService } from "../services/TrelloService.js";
import { GoogleOAuthService } from "../services/GoogleOAuthService.js";
import { SessionService } from "../services/SessionService.js";
import { LinkDetectionService } from "../services/LinkDetectionService.js";
import { LangChainSqlService } from "../services/LangChainSqlService.js";
import { createAIControllers } from "./ai/index.js";
import { createTrelloControllers } from "./trello/index.js";
import { createDriveControllers } from "./drive/index.js";
import { createGmailControllers } from "./gmail/index.js";

// Initialize shared dependencies
const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize service instances
const trelloService = new TrelloService();
const googleOAuth = new GoogleOAuthService();
const sessionService = new SessionService(prisma);
const linkDetectionService = new LinkDetectionService(prisma);
const langchainService = new LangChainSqlService(process.env.OPENAI_API_KEY, prisma);

/**
 * Initialize and export all controllers with their dependencies
 */
export const controllers = {
  ai: createAIControllers({ openai, prisma, langchainService }),
  trello: createTrelloControllers({ trelloService, prisma }),
  drive: createDriveControllers({ googleOAuth, prisma, linkDetectionService }),
  gmail: createGmailControllers({ googleOAuth, prisma, linkDetectionService })
};

// Export service instances for use in route files
export const services = {
  prisma,
  openai,
  trelloService,
  googleOAuth,
  sessionService,
  linkDetectionService,
  langchainService
};

export default controllers;
