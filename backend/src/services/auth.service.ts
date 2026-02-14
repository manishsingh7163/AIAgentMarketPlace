import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import { prisma } from "../config/database";
import { config } from "../config";
import { AuthPayload } from "../types";
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from "../middleware/errorHandler";

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Register a new AI agent (web UI — email + password)
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    description?: string;
  }) {
    const existingEmail = await prisma.agent.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new ConflictError("An agent with this email already exists");
    }

    const existingName = await prisma.agent.findUnique({
      where: { name: data.name },
    });
    if (existingName) {
      throw new ConflictError("An agent with this name already exists. Agent names must be unique.");
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const apiKey = `ak_${uuidv4().replace(/-/g, "")}`;

    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        apiKey,
        description: data.description,
        isClaimed: true, // Web-registered agents are auto-claimed by their creator
      },
      select: {
        id: true,
        name: true,
        email: true,
        apiKey: true,
        status: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({
      agentId: agent.id,
      email: agent.email ?? "",
    });

    return { agent, token };
  }

  /**
   * Agent self-registration (API — just name + description, like Moltbook)
   * Returns API key + claim URL. Human claims later.
   */
  async agentRegister(data: { name: string; description?: string }) {
    const existingName = await prisma.agent.findUnique({
      where: { name: data.name },
    });
    if (existingName) {
      throw new ConflictError(
        `An agent named "${data.name}" already exists. Choose a different name.`
      );
    }

    const apiKey = `ak_${uuidv4().replace(/-/g, "")}`;
    const claimToken = `claim_${crypto.randomBytes(24).toString("hex")}`;

    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        apiKey,
        description: data.description,
        claimToken,
        isClaimed: false,
      },
      select: {
        id: true,
        name: true,
        apiKey: true,
        status: true,
        claimToken: true,
        createdAt: true,
      },
    });

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        apiKey: agent.apiKey,
        status: agent.status,
      },
      claimToken: agent.claimToken,
    };
  }

  /**
   * Human claims an agent using the claim token
   */
  async claimAgent(claimToken: string, ownerEmail: string) {
    const agent = await prisma.agent.findUnique({
      where: { claimToken },
    });

    if (!agent) {
      throw new NotFoundError(
        "Invalid claim token. Check the URL and try again."
      );
    }

    if (agent.isClaimed) {
      throw new BadRequestError("This agent has already been claimed.");
    }

    const updated = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        isClaimed: true,
        ownerEmail,
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        status: true,
        isClaimed: true,
        ownerEmail: true,
      },
    });

    return updated;
  }

  /**
   * Get agent claim status (agent uses API key to check)
   */
  async getClaimStatus(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        isClaimed: true,
        status: true,
        ownerEmail: true,
      },
    });

    if (!agent) {
      throw new NotFoundError("Agent not found");
    }

    return {
      status: agent.isClaimed ? "claimed" : "pending_claim",
      agentStatus: agent.status,
      ownerEmail: agent.ownerEmail
        ? agent.ownerEmail.replace(/(.{2}).*(@.*)/, "$1***$2")
        : null,
    };
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string) {
    const agent = await prisma.agent.findUnique({
      where: { email },
    });

    if (!agent) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (agent.status === "SUSPENDED") {
      throw new UnauthorizedError("Account is suspended");
    }

    if (!agent.passwordHash) {
      throw new UnauthorizedError(
        "This agent was registered via API. Use the API key to authenticate, or claim the agent first."
      );
    }

    const isValidPassword = await bcrypt.compare(password, agent.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = this.generateToken({
      agentId: agent.id,
      email: agent.email ?? "",
    });

    return {
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        apiKey: agent.apiKey,
        status: agent.status,
        rating: agent.rating,
        totalTrades: agent.totalTrades,
      },
      token,
    };
  }

  /**
   * Regenerate API key for an agent
   */
  async regenerateApiKey(agentId: string) {
    const apiKey = `ak_${uuidv4().replace(/-/g, "")}`;

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: { apiKey },
      select: { apiKey: true },
    });

    return agent;
  }

  private generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as jwt.SignOptions);
  }
}

export const authService = new AuthService();
