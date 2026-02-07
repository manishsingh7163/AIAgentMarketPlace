import { Prisma, type Prisma as PrismaTypes } from "@prisma/client";
import { prisma } from "../config/database";
import { ListingFilters, PaginationQuery } from "../types";
import { NotFoundError, ForbiddenError } from "../middleware/errorHandler";

export class ListingService {
  /**
   * Create a new listing
   */
  async create(
    agentId: string,
    data: {
      title: string;
      description: string;
      category: string;
      type: "BUY" | "SELL";
      price: number;
      currency?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      expiresAt?: string;
    }
  ) {
    const listing = await prisma.listing.create({
      data: {
        agentId,
        title: data.title,
        description: data.description,
        category: data.category as any,
        type: data.type as any,
        price: data.price,
        currency: data.currency || "USD",
        tags: data.tags || [],
        metadata: (data.metadata as Prisma.InputJsonValue) || undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
      include: {
        agent: {
          select: { id: true, name: true, rating: true, status: true },
        },
      },
    });

    return listing;
  }

  /**
   * Get listings with filters and pagination
   */
  async findAll(filters: ListingFilters, pagination: PaginationQuery) {
    const page = pagination.page || 1;
    const limit = Math.min(pagination.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: Prisma.ListingWhereInput = {
      status: (filters.status as any) || "ACTIVE",
    };

    if (filters.category) where.category = filters.category as any;
    if (filters.type) where.type = filters.type as any;
    if (filters.agentId) where.agentId = filters.agentId;
    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = filters.minPrice;
      if (filters.maxPrice) where.price.lte = filters.maxPrice;
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    const orderBy: Prisma.ListingOrderByWithRelationInput = {};
    const sortBy = pagination.sortBy || "createdAt";
    const sortOrder = pagination.sortOrder || "desc";
    (orderBy as any)[sortBy] = sortOrder;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          agent: {
            select: { id: true, name: true, rating: true, status: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      listings,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single listing by ID
   */
  async findById(id: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            rating: true,
            status: true,
            description: true,
            totalTrades: true,
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return listing;
  }

  /**
   * Update a listing
   */
  async update(
    id: string,
    agentId: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      tags?: string[];
      status?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }
    if (listing.agentId !== agentId) {
      throw new ForbiddenError("You can only update your own listings");
    }

    const updateData: Prisma.ListingUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.status !== undefined) updateData.status = data.status as any;
    if (data.metadata !== undefined) updateData.metadata = data.metadata as Prisma.InputJsonValue;

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        agent: {
          select: { id: true, name: true, rating: true, status: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete (cancel) a listing
   */
  async delete(id: string, agentId: string) {
    const listing = await prisma.listing.findUnique({ where: { id } });

    if (!listing) {
      throw new NotFoundError("Listing not found");
    }
    if (listing.agentId !== agentId) {
      throw new ForbiddenError("You can only delete your own listings");
    }

    await prisma.listing.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return { message: "Listing cancelled successfully" };
  }
}

export const listingService = new ListingService();
