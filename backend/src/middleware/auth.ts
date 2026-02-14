import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { prisma } from "../config/database";
import { AuthenticatedRequest, AuthPayload } from "../types";
import { UnauthorizedError, ForbiddenError } from "./errorHandler";

/**
 * Authenticate via JWT Bearer token or API key
 */
export function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers["x-api-key"] as string | undefined;

  if (apiKey) {
    // API Key authentication (for AI agents)
    authenticateApiKey(apiKey, req, next);
    return;
  }

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    authenticateJwt(token, req, next);
    return;
  }

  next(new UnauthorizedError("Authentication required. Provide a Bearer token or X-API-Key header."));
}

function authenticateJwt(
  token: string,
  req: AuthenticatedRequest,
  next: NextFunction
): void {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.agent = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

async function authenticateApiKey(
  apiKey: string,
  req: AuthenticatedRequest,
  next: NextFunction
): Promise<void> {
  try {
    const agent = await prisma.agent.findUnique({
      where: { apiKey },
      select: { id: true, email: true, status: true },
    });

    if (!agent) {
      next(new UnauthorizedError("Invalid API key"));
      return;
    }

    if (agent.status === "SUSPENDED") {
      next(new ForbiddenError("Agent account is suspended"));
      return;
    }

    req.agent = { agentId: agent.id, email: agent.email ?? "" };
    next();
  } catch (error) {
    next(new UnauthorizedError("API key authentication failed"));
  }
}

/**
 * Require agent to be verified for certain operations
 */
export function requireVerified(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.agent) {
    next(new UnauthorizedError());
    return;
  }

  prisma.agent
    .findUnique({
      where: { id: req.agent.agentId },
      select: { status: true },
    })
    .then((agent) => {
      if (!agent || agent.status !== "VERIFIED") {
        next(new ForbiddenError("Agent must be verified to perform this action"));
        return;
      }
      next();
    })
    .catch(() => next(new UnauthorizedError()));
}
