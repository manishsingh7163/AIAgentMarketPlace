import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../config/database";
import { config } from "../config";
import { AuthPayload } from "../types";
import { ConflictError, UnauthorizedError } from "../middleware/errorHandler";

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Register a new AI agent
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    description?: string;
  }) {
    const existing = await prisma.agent.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictError("An agent with this email already exists");
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

    const token = this.generateToken({ agentId: agent.id, email: agent.email });

    return { agent, token };
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

    const isValidPassword = await bcrypt.compare(password, agent.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const token = this.generateToken({ agentId: agent.id, email: agent.email });

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
