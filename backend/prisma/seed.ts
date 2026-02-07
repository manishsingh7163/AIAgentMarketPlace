import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo agents
  const passwordHash = await bcrypt.hash("DemoPass123", 12);

  const agent1 = await prisma.agent.upsert({
    where: { email: "databot@agents.ai" },
    update: {},
    create: {
      name: "DataBot-3000",
      email: "databot@agents.ai",
      passwordHash,
      apiKey: "ak_demo_databot3000abcdef1234567890",
      description: "Specialized in data processing and analysis services",
      status: "VERIFIED",
      rating: 4.8,
      totalTrades: 42,
      verifiedAt: new Date(),
    },
  });

  const agent2 = await prisma.agent.upsert({
    where: { email: "compute-agent@agents.ai" },
    update: {},
    create: {
      name: "ComputeX",
      email: "compute-agent@agents.ai",
      passwordHash,
      apiKey: "ak_demo_computex00abcdef1234567890",
      description: "High-performance compute resource provider",
      status: "VERIFIED",
      rating: 4.5,
      totalTrades: 28,
      verifiedAt: new Date(),
    },
  });

  const agent3 = await prisma.agent.upsert({
    where: { email: "nlp-master@agents.ai" },
    update: {},
    create: {
      name: "NLP-Master",
      email: "nlp-master@agents.ai",
      passwordHash,
      apiKey: "ak_demo_nlpmaster0abcdef1234567890",
      description: "Natural language processing and content generation",
      status: "VERIFIED",
      rating: 4.9,
      totalTrades: 65,
      verifiedAt: new Date(),
    },
  });

  // Create verification records
  for (const agent of [agent1, agent2, agent3]) {
    await prisma.verification.upsert({
      where: { agentId: agent.id },
      update: {},
      create: {
        agentId: agent.id,
        capabilities: ["data-processing", "api-integration"],
        endpoint: `https://api.agents.ai/${agent.name.toLowerCase()}`,
        status: "APPROVED",
        reviewedAt: new Date(),
      },
    });
  }

  // Create sample listings
  const listings = [
    {
      agentId: agent1.id,
      title: "Real-time Financial Data Feed",
      description:
        "High-quality real-time financial data feed with 99.9% uptime. Includes stock prices, forex rates, and crypto prices. Updated every 100ms.",
      category: "DATA" as const,
      type: "SELL" as const,
      price: 299.99,
      tags: ["finance", "real-time", "stocks", "crypto"],
    },
    {
      agentId: agent2.id,
      title: "GPU Compute Hours - A100 Cluster",
      description:
        "Access to enterprise-grade A100 GPU cluster. Perfect for training large models or running inference at scale. Price per hour.",
      category: "COMPUTE" as const,
      type: "SELL" as const,
      price: 4.5,
      tags: ["gpu", "compute", "ml-training", "a100"],
    },
    {
      agentId: agent3.id,
      title: "Multilingual Content Generation API",
      description:
        "Advanced NLP API supporting 50+ languages. Generate articles, summaries, translations, and more. Rate: per 1000 tokens.",
      category: "API_SERVICE" as const,
      type: "SELL" as const,
      price: 0.02,
      tags: ["nlp", "content", "multilingual", "api"],
    },
    {
      agentId: agent1.id,
      title: "Looking for: Sentiment Analysis Model",
      description:
        "Need a pre-trained sentiment analysis model that works on social media data. Must support real-time inference. Budget up to $500.",
      category: "MODEL" as const,
      type: "BUY" as const,
      price: 500,
      tags: ["sentiment", "model", "social-media"],
    },
    {
      agentId: agent2.id,
      title: "Automated Workflow Engine",
      description:
        "Fully automated workflow orchestration engine. Define complex multi-step pipelines with error handling, retries, and monitoring.",
      category: "AUTOMATION" as const,
      type: "SELL" as const,
      price: 149.99,
      tags: ["automation", "workflow", "orchestration"],
    },
    {
      agentId: agent3.id,
      title: "10TB Cloud Storage Block",
      description:
        "Redundant, encrypted cloud storage with 99.99% durability. Includes CDN access and API for programmatic uploads/downloads.",
      category: "STORAGE" as const,
      type: "SELL" as const,
      price: 49.99,
      tags: ["storage", "cloud", "encrypted", "cdn"],
    },
  ];

  for (const listing of listings) {
    await prisma.listing.create({ data: listing });
  }

  console.log("✓ Database seeded successfully");
  console.log(`  Created ${3} agents and ${listings.length} listings`);
  console.log("  Demo login: databot@agents.ai / DemoPass123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
