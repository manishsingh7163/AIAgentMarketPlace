import { prisma } from "../config/database";
import { config } from "../config";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler";

/**
 * Payment service — handles USDC on Solana payment instructions and verification.
 *
 * Flow:
 * 1. Buyer places order → system calculates amounts
 * 2. Both parties verify the order → status = VERIFIED
 * 3. Buyer sends USDC to seller's wallet + platform fee to platform wallet
 * 4. Buyer submits tx signatures via /api/orders/:id/pay
 * 5. System records signatures and marks transaction as completed
 */
export class PaymentService {
  /**
   * Get payment instructions for an order
   * Returns wallet addresses and amounts the buyer needs to send
   */
  async getPaymentInstructions(orderId: string, agentId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: { select: { id: true, name: true, walletAddress: true } },
        seller: { select: { id: true, name: true, walletAddress: true } },
        listing: { select: { title: true } },
        transaction: true,
      },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.buyerId !== agentId && order.sellerId !== agentId) {
      throw new BadRequestError("You are not part of this order");
    }

    const platformWallet = config.platform.walletAddress;
    const sellerWallet = order.seller.walletAddress;

    return {
      order: {
        id: order.id,
        status: order.status,
        listing: order.listing.title,
      },
      payment: {
        currency: "USDC",
        network: "Solana",
        totalAmount: order.totalAmount,
        breakdown: {
          sellerAmount: order.amount - order.platformFee,
          platformFee: order.platformFee,
          feePercent: config.platform.feePercent,
        },
        instructions: [
          {
            label: "Pay seller",
            to: sellerWallet || null,
            toName: order.seller.name,
            amount: order.amount - order.platformFee,
            currency: "USDC",
            note: sellerWallet
              ? undefined
              : "Seller has not set up their wallet yet",
          },
          {
            label: "Platform fee (1%)",
            to: platformWallet || null,
            toName: "AgentMarket Platform",
            amount: order.platformFee,
            currency: "USDC",
            note: platformWallet
              ? undefined
              : "Platform wallet not configured",
          },
        ],
      },
      buyer: {
        name: order.buyer.name,
        walletAddress: order.buyer.walletAddress || null,
      },
      seller: {
        name: order.seller.name,
        walletAddress: order.seller.walletAddress || null,
      },
      alreadyPaid:
        order.transaction?.txSignature != null
          ? {
              txSignature: order.transaction.txSignature,
              feeTxSignature: order.transaction.feeTxSignature,
            }
          : null,
    };
  }

  /**
   * Submit payment proof — buyer submits Solana tx signatures after sending USDC
   */
  async submitPayment(
    orderId: string,
    agentId: string,
    data: {
      txSignature: string; // Solana tx signature for seller payment
      feeTxSignature?: string; // Solana tx signature for platform fee
    }
  ) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { transaction: true },
    });

    if (!order) {
      throw new NotFoundError("Order not found");
    }

    if (order.buyerId !== agentId) {
      throw new BadRequestError("Only the buyer can submit payment");
    }

    if (order.status !== "VERIFIED" && order.status !== "IN_PROGRESS") {
      throw new BadRequestError(
        "Order must be VERIFIED before payment can be submitted"
      );
    }

    if (order.transaction?.txSignature) {
      throw new BadRequestError("Payment has already been submitted for this order");
    }

    const netAmount = order.amount - order.platformFee;

    // Update or create the transaction with payment info
    if (order.transaction) {
      // Transaction exists, update with payment proof
      await prisma.transaction.update({
        where: { id: order.transaction.id },
        data: {
          txSignature: data.txSignature,
          feeTxSignature: data.feeTxSignature || null,
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });
    } else {
      // Create transaction with payment proof
      await prisma.transaction.create({
        data: {
          orderId,
          amount: order.amount,
          platformFee: order.platformFee,
          netAmount,
          txSignature: data.txSignature,
          feeTxSignature: data.feeTxSignature || null,
          paymentMethod: "USDC_SOLANA",
          status: "COMPLETED",
          processedAt: new Date(),
        },
      });
    }

    // Mark order as completed
    const [updatedOrder] = await prisma.$transaction([
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
          transaction: true,
        },
      }),
      prisma.agent.update({
        where: { id: order.sellerId },
        data: { totalTrades: { increment: 1 } },
      }),
      prisma.agent.update({
        where: { id: order.buyerId },
        data: { totalTrades: { increment: 1 } },
      }),
      prisma.listing.update({
        where: { id: order.listingId },
        data: { status: "SOLD" },
      }),
    ]);

    return {
      order: updatedOrder,
      payment: {
        status: "completed",
        txSignature: data.txSignature,
        feeTxSignature: data.feeTxSignature || null,
        explorerUrl: `https://solscan.io/tx/${data.txSignature}`,
      },
    };
  }

  /**
   * Set wallet address for an agent
   */
  async setWalletAddress(agentId: string, walletAddress: string) {
    // Basic Solana address validation (base58, 32-44 chars)
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(walletAddress)) {
      throw new BadRequestError(
        "Invalid Solana wallet address. Must be a valid base58-encoded address."
      );
    }

    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: { walletAddress },
      select: {
        id: true,
        name: true,
        walletAddress: true,
      },
    });

    return agent;
  }

  /**
   * Get platform payment info (for public display)
   */
  getPlatformInfo() {
    return {
      currency: "USDC",
      network: "Solana",
      networkId: config.solana.network,
      usdcMint: config.solana.usdcMint,
      platformFeePercent: config.platform.feePercent,
      platformWallet: config.platform.walletAddress || null,
      explorerBase: "https://solscan.io",
    };
  }
}

export const paymentService = new PaymentService();
