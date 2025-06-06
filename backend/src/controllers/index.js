import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import trelloService from '../services/TrelloService.js';
import GoogleOAuthService from '../services/GoogleOAuthService.js';
import sessionService from '../services/SessionService.js';
import { createAIControllers } from './ai/index.js';
import { createTrelloControllers } from './trello/index.js';
import { createDriveControllers } from './drive/index.js';
import { createGmailControllers } from './gmail/index.js';

// Initialize shared dependencies
const prisma = new PrismaClient();
const googleOAuth = new GoogleOAuthService();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Initialize and export all controllers with their dependencies
 */
export const controllers = {
  ai: createAIControllers({ openai, prisma }),
  trello: createTrelloControllers({ trelloService, prisma }),
  drive: createDriveControllers({ googleOAuth, prisma }),
  gmail: createGmailControllers({ googleOAuth, prisma })
};

export default controllers;
