import { prisma } from "../config/database";
import { config } from "../config";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
} from "../middleware/errorHandler";
import { PaginationQuery } from "../types";
import { createHash } from "crypto";

export class OrderService {
  /**
   * Create an order from a listing
   */
  async create(buyerId: string, listingId: string, notes?: string) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { agent: { select: { id: true, status: true } } },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }
    if (listing.status !== "ACTIVE") {
      throw new BadRequestError("Listing is not available");
    }
    if (listing.agentId === buyerId) {
      throw new BadRequestError("You cannot buy your own listing");
    }

    // Determine buyer/seller based on listing type
    let sellerId: string;

    if (listing.type === "SELL") {
      // Agent is selling, buyer is the current user
      sellerId = listing.agentId;
    } else {
      // Agent wants to buy, so the current user is the seller
      sellerId = buyerId;
      // The listing owner is the buyer
      return this.createBuyOrder(listing, buyerId, notes);
    }

    const platformFee = (listing.price * config.platform.feePercent) / 100;
    const totalAmount = listing.price + platformFee;

    // Generate verification hash
    const verificationHash = this.generateVerificationHash(
      buyerId,
      sellerId,
      listingId,
      listing.price
    );

    const order = await prisma.order.create({
      data: {
        listingId,
        buyerId,
        sellerId,
        amount: listing.price,
        platformFee,
        totalAmount,
        verificationHash,
        notes,
      },
      include: {
        listing: { select: { id: true, title: true, type: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    return order;
  }

  private async createBuyOrder(
    listing: any,
    sellerId: string,
    notes?: string
  ) {
    const buyerId = listing.agentId;
    const platformFee = (listing.price * config.platform.feePercent) / 100;
    const totalAmount = listing.price + platformFee;

    const verificationHash = this.generateVerificationHash(
      buyerId,
      sellerId,
      listing.id,
      listing.price
    );

    const order = await prisma.order.create({
      data: {
        listingId: listing.id,
        buyerId,
        sellerId,
        amount: listing.price,
        platformFee,
        totalAmount,
        verificationHash,
        notes,
      },
      include: {
        listing: { select: { id: true, title: true, type: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    return order;
  }

  /**
   * Verify an order (both buyer and seller must verify)
   */
  async verify(orderId: string, agentId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.status !== "PENDING_VERIFICATION" && order.status !== "VERIFIED") {
      throw new BadRequestError("Order cannot be verified in its current state");
    }

    const updateData: any = {};

    if (order.buyerId === agentId) {
      if (order.buyerVerified) {
        throw new BadRequestError("You have already verified this order");
      }
      updateData.buyerVerified = true;
    } else if (order.sellerId === agentId) {
      if (order.sellerVerified) {
        throw new BadRequestError("You have already verified this order");
      }
      updateData.sellerVerified = true;
    } else {
      throw new ForbiddenError("You are not part of this order");
    }

    // Check if both parties have now verified
    const buyerVerified =
      updateData.buyerVerified || order.buyerVerified;
    const sellerVerified =
      updateData.sellerVerified || order.sellerVerified;

    if (buyerVerified && sellerVerified) {
      updateData.status = "VERIFIED";
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        listing: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Complete an order and create a transaction
   */
  async complete(orderId: string, agentId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.sellerId !== agentId && order.buyerId !== agentId) {
      throw new ForbiddenError("You are not part of this order");
    }

    if (order.status !== "VERIFIED" && order.status !== "IN_PROGRESS") {
      throw new BadRequestError(
        "Order must be verified before it can be completed"
      );
    }

    const netAmount = order.amount - order.platformFee;

    // Use a transaction to ensure atomicity
    const [updatedOrder, transaction] = await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
        include: {
          listing: { select: { id: true, title: true } },
          buyer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
        },
      }),
      prisma.transaction.create({
        data: {
          orderId,
          amount: order.amount,
          platformFee: order.platformFee,
          netAmount,
          status: "COMPLETED",
          processedAt: new Date(),
        },
      }),
      // Update seller's trade count
      prisma.agent.update({
        where: { id: order.sellerId },
        data: { totalTrades: { increment: 1 } },
      }),
      // Update buyer's trade count
      prisma.agent.update({
        where: { id: order.buyerId },
        data: { totalTrades: { increment: 1 } },
      }),
      // Mark listing as sold if it's a SELL listing
      prisma.listing.update({
        where: { id: order.listingId },
        data: { status: "SOLD" },
      }),
    ]);

    return { order: updatedOrder, transaction };
  }

  /**
   * Cancel an order
   */
  async cancel(orderId: string, agentId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.buyerId !== agentId && order.sellerId !== agentId) {
      throw new ForbiddenError("You are not part of this order");
    }
    if (order.status === "COMPLETED") {
      throw new BadRequestError("Completed orders cannot be cancelled");
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: "CANCELLED" },
      include: {
        listing: { select: { id: true, title: true } },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Get orders for an agent
   */
  async findByAgent(agentId: string, pagination: PaginationQuery) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where = {
      OR: [{ buyerId: agentId }, { sellerId: agentId }],
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          listing: { select: { id: true, title: true, type: true, category: true } },
          buyer: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true } },
          transaction: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single order by ID
   */
  async findById(orderId: string, agentId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        listing: true,
        buyer: { select: { id: true, name: true, rating: true } },
        seller: { select: { id: true, name: true, rating: true } },
        transaction: true,
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }
    if (order.buyerId !== agentId && order.sellerId !== agentId) {
      throw new ForbiddenError("You are not part of this order");
    }

    return order;
  }

  private generateVerificationHash(
    buyerId: string,
    sellerId: string,
    listingId: string,
    amount: number
  ): string {
    const data = `${buyerId}:${sellerId}:${listingId}:${amount}:${Date.now()}`;
    return createHash("sha256").update(data).digest("hex");
  }
}

export const orderService = new OrderService();
