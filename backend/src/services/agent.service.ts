import { prisma } from "../config/database";
import { NotFoundError, BadRequestError } from "../middleware/errorHandler";

export class AgentService {
  /**
   * Get agent profile by ID (own profile — includes sensitive data)
   */
  async getProfile(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        email: true,
        apiKey: true,
        avatar: true,
        description: true,
        status: true,
        rating: true,
        totalTrades: true,
        walletAddress: true,
        isClaimed: true,
        verifiedAt: true,
        lastActive: true,
        createdAt: true,
        verificaiton: {
          select: {
            status: true,
            capabilities: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundError("Agent not found");
    }

    return agent;
  }

  /**
   * Get public agent profile by ID (no sensitive data)
   */
  async getPublicProfile(agentId: string) {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        avatar: true,
        description: true,
        status: true,
        rating: true,
        totalTrades: true,
        isClaimed: true,
        lastActive: true,
        createdAt: true,
      },
    });

    if (!agent) {
      throw new NotFoundError("Agent not found");
    }

    return agent;
  }

  /**
   * Get public agent profile by name (like Moltbook's /u/AgentName)
   */
  async getPublicProfileByName(name: string) {
    const agent = await prisma.agent.findUnique({
      where: { name },
      select: {
        id: true,
        name: true,
        avatar: true,
        description: true,
        status: true,
        rating: true,
        totalTrades: true,
        isClaimed: true,
        lastActive: true,
        createdAt: true,
        verificaiton: {
          select: {
            capabilities: true,
          },
        },
      },
    });

    if (!agent) {
      throw new NotFoundError(`Agent "${name}" not found`);
    }

    // Get recent listings
    const recentListings = await prisma.listing.findMany({
      where: { agentId: agent.id, status: "ACTIVE" },
      select: {
        id: true,
        title: true,
        category: true,
        type: true,
        price: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return { agent, recentListings };
  }

  /**
   * List all verified/active agents (public directory)
   */
  async getDirectory(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where: {
          OR: [{ status: "VERIFIED" }, { isClaimed: true }],
        },
        select: {
          id: true,
          name: true,
          avatar: true,
          description: true,
          status: true,
          rating: true,
          totalTrades: true,
          isClaimed: true,
          lastActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.agent.count({
        where: {
          OR: [{ status: "VERIFIED" }, { isClaimed: true }],
        },
      }),
    ]);

    return {
      data: agents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update agent profile
   */
  async updateProfile(
    agentId: string,
    data: { name?: string; description?: string; avatar?: string; walletAddress?: string }
  ) {
    const agent = await prisma.agent.update({
      where: { id: agentId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        description: true,
        status: true,
        rating: true,
        totalTrades: true,
      },
    });

    return agent;
  }

  /**
   * Touch last active timestamp
   */
  async touchLastActive(agentId: string) {
    await prisma.agent.update({
      where: { id: agentId },
      data: { lastActive: new Date() },
    });
  }

  /**
   * Submit verification request
   */
  async submitVerification(
    agentId: string,
    data: {
      capabilities: string[];
      endpoint?: string;
      webhookUrl?: string;
      publicKey?: string;
    }
  ) {
    const existing = await prisma.verification.findUnique({
      where: { agentId },
    });

    if (existing && existing.status === "APPROVED") {
      throw new BadRequestError("Agent is already verified");
    }

    if (existing && existing.status === "PENDING") {
      throw new BadRequestError("Verification request already pending");
    }

    const verification = await prisma.verification.upsert({
      where: { agentId },
      create: {
        agentId,
        capabilities: data.capabilities,
        endpoint: data.endpoint,
        webhookUrl: data.webhookUrl,
        publicKey: data.publicKey,
      },
      update: {
        capabilities: data.capabilities,
        endpoint: data.endpoint,
        webhookUrl: data.webhookUrl,
        publicKey: data.publicKey,
        status: "PENDING",
        reviewNotes: null,
      },
    });

    return verification;
  }

  /**
   * Get verification status
   */
  async getVerificationStatus(agentId: string) {
    const verification = await prisma.verification.findUnique({
      where: { agentId },
      select: {
        id: true,
        status: true,
        capabilities: true,
        endpoint: true,
        reviewNotes: true,
        createdAt: true,
        reviewedAt: true,
      },
    });

    return verification;
  }

  /**
   * Approve verification (admin action — in production, protect behind admin auth)
   */
  async approveVerification(agentId: string, notes?: string) {
    const verification = await prisma.verification.update({
      where: { agentId },
      data: {
        status: "APPROVED",
        reviewNotes: notes,
        reviewedAt: new Date(),
      },
    });

    await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    return verification;
  }

  /**
   * Get agent dashboard stats
   */
  async getDashboardStats(agentId: string) {
    const [activeListings, totalOrders, completedOrders, revenue] =
      await Promise.all([
        prisma.listing.count({
          where: { agentId, status: "ACTIVE" },
        }),
        prisma.order.count({
          where: { OR: [{ buyerId: agentId }, { sellerId: agentId }] },
        }),
        prisma.order.count({
          where: {
            OR: [{ buyerId: agentId }, { sellerId: agentId }],
            status: "COMPLETED",
          },
        }),
        prisma.transaction.aggregate({
          where: {
            order: { sellerId: agentId },
            status: "COMPLETED",
          },
          _sum: { netAmount: true },
        }),
      ]);

    return {
      activeListings,
      totalOrders,
      completedOrders,
      totalRevenue: revenue._sum.netAmount || 0,
    };
  }
}

export const agentService = new AgentService();
