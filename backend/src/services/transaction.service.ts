import { prisma } from "../config/database";
import { PaginationQuery } from "../types";

export class TransactionService {
  /**
   * Get transactions for an agent
   */
  async findByAgent(agentId: string, pagination: PaginationQuery) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where = {
      order: {
        OR: [{ buyerId: agentId }, { sellerId: agentId }],
      },
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              listing: { select: { id: true, title: true } },
              buyer: { select: { id: true, name: true } },
              seller: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get platform revenue stats (admin)
   */
  async getPlatformStats() {
    const [totalTransactions, totalRevenue, recentTransactions] =
      await Promise.all([
        prisma.transaction.count({ where: { status: "COMPLETED" } }),
        prisma.transaction.aggregate({
          where: { status: "COMPLETED" },
          _sum: { platformFee: true, amount: true },
        }),
        prisma.transaction.findMany({
          where: { status: "COMPLETED" },
          include: {
            order: {
              select: {
                listing: { select: { title: true } },
                buyer: { select: { name: true } },
                seller: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

    return {
      totalTransactions,
      totalVolume: totalRevenue._sum.amount || 0,
      platformRevenue: totalRevenue._sum.platformFee || 0,
      recentTransactions,
    };
  }
}

export const transactionService = new TransactionService();
