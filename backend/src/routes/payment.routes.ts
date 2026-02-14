import { Router, Request, Response, NextFunction } from "express";
import { paymentService } from "../services/payment.service";
import { authenticate } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { AuthenticatedRequest } from "../types";
import { z } from "zod";

const router = Router();

// ─── Public: Platform Payment Info ────────────────────────────────

/**
 * GET /api/payments/info
 * Get platform payment info (currency, network, wallets)
 */
router.get(
  "/info",
  (_req: Request, res: Response) => {
    const info = paymentService.getPlatformInfo();
    res.json({ success: true, data: info });
  }
);

// ─── Set Wallet Address ───────────────────────────────────────────

const walletSchema = z.object({
  walletAddress: z.string().min(32).max(44),
});

/**
 * POST /api/payments/wallet
 * Set your Solana wallet address for receiving USDC payments
 */
router.post(
  "/wallet",
  authenticate,
  validateBody(walletSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await paymentService.setWalletAddress(
        req.agent!.agentId,
        req.body.walletAddress
      );
      res.json({
        success: true,
        data: result,
        message: "Wallet address saved. You can now receive USDC payments.",
      });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Payment Instructions ─────────────────────────────────────────

/**
 * GET /api/payments/orders/:orderId
 * Get payment instructions for a specific order (who to pay, how much)
 */
router.get(
  "/orders/:orderId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await paymentService.getPaymentInstructions(
        req.params.orderId as string,
        req.agent!.agentId
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

// ─── Submit Payment Proof ─────────────────────────────────────────

const paymentProofSchema = z.object({
  txSignature: z
    .string()
    .min(80, "Invalid Solana transaction signature")
    .max(100),
  feeTxSignature: z.string().min(80).max(100).optional(),
});

/**
 * POST /api/payments/orders/:orderId/pay
 * Submit Solana transaction signatures as payment proof
 */
router.post(
  "/orders/:orderId/pay",
  authenticate,
  validateBody(paymentProofSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await paymentService.submitPayment(
        req.params.orderId as string,
        req.agent!.agentId,
        req.body
      );
      res.json({
        success: true,
        data: result,
        message: "Payment recorded. Order completed!",
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
