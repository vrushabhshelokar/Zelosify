import { PrismaClient, Role, AuthProvider, OpeningStatus } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds the database with sample job openings for Bruce Wayne Corp testing.
 */
async function seedOpenings() {
  try {
    console.log("🌱 Starting Zelosify Openings Seeding...");

    // 1. Create or retrieve Tenant "Bruce Wayne Corp"
    let tenant = await prisma.tenants.findFirst({
      where: { companyName: "Bruce Wayne Corp" },
    });

    if (!tenant) {
      tenant = await prisma.tenants.create({
        data: {
          companyName: "Bruce Wayne Corp",
        },
      });
      console.log(`✅ Created Tenant: Bruce Wayne Corp (${tenant.tenantId})`);
    } else {
      console.log(`ℹ️ Tenant Bruce Wayne Corp already exists (${tenant.tenantId})`);
    }

    // 2. Find existing Hiring Manager for this tenant or create default
    let hiringManager = await prisma.user.findFirst({
      where: {
        tenantId: tenant.tenantId,
        role: Role.HIRING_MANAGER,
      },
    });

    if (!hiringManager) {
      const defaultManagerId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
      hiringManager = await prisma.user.upsert({
        where: { id: defaultManagerId },
        update: {
          tenantId: tenant.tenantId,
          role: Role.HIRING_MANAGER,
        },
        create: {
          id: defaultManagerId,
          username: "rachel.dawes",
          email: "rachel.dawes@waynecorp.com",
          firstName: "Rachel",
          lastName: "Dawes",
          department: "Talent Acquisition",
          role: Role.HIRING_MANAGER,
          tenantId: tenant.tenantId,
          provider: AuthProvider.KEYCLOAK,
          profileComplete: true,
        },
      });
    }
    console.log(`✅ Seed Hiring Manager ready: ${hiringManager.email} (${hiringManager.id})`);

    // 3. Define 14 Diverse Openings for Bruce Wayne Corp
    const openingsData = [
      {
        title: "Senior Full Stack Engineer (React/Node)",
        description: "Looking for an experienced Full Stack engineer skilled in TypeScript, Next.js, Node.js, and PostgreSQL to lead high-throughput microservices.",
        location: "Remote",
        contractType: "C2H",
        experienceMin: 5,
        experienceMax: 9,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Backend Cloud Architect (Node/Go/AWS)",
        description: "Enterprise backend architect to design resilient, multi-tenant cloud microservices on AWS with ECS, S3, and RDS.",
        location: "Gotham City, NY",
        contractType: "Fixed Contract",
        experienceMin: 8,
        experienceMax: 14,
        status: OpeningStatus.OPEN,
      },
      {
        title: "AI/ML Platform Engineer (Python/LLMs/FastAPI)",
        description: "Build production-grade LLM tool-calling orchestration pipelines, vector search integration, and deterministic evaluation engines.",
        location: "Remote",
        contractType: "Full-time Contract",
        experienceMin: 4,
        experienceMax: 8,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Lead DevOps & Kubernetes Specialist",
        description: "Manage high-availability Kubernetes clusters, Helm charts, Terraform IAC, and automated multi-environment CI/CD pipelines.",
        location: "Remote",
        contractType: "C2H",
        experienceMin: 6,
        experienceMax: 11,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Frontend React Specialist (Tailwind/Radix)",
        description: "Design high-performance enterprise dashboards with virtualized tables, accessible components, and modern responsive UI states.",
        location: "Gotham City, NY",
        contractType: "Fixed Contract",
        experienceMin: 3,
        experienceMax: 6,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Data Infrastructure Engineer (Kafka/Postgres/Spark)",
        description: "Build robust streaming pipelines and maintain high-volume data warehouses with distributed transactions and ACID compliance.",
        location: "Remote",
        contractType: "C2H",
        experienceMin: 4,
        experienceMax: 7,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Cyber Security Analyst & Penetration Tester",
        description: "Audit web application vulnerabilities, enforce OAuth2/OIDC standards, and implement prompt-injection defense mechanisms.",
        location: "Gotham City, NY",
        contractType: "Fixed Contract",
        experienceMin: 5,
        experienceMax: 10,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Mobile App Developer (React Native/iOS/Android)",
        description: "Develop cross-platform enterprise mobile applications with offline-first caching and real-time push notifications.",
        location: "Remote",
        contractType: "Full-time Contract",
        experienceMin: 3,
        experienceMax: 6,
        status: OpeningStatus.OPEN,
      },
      {
        title: "QA Automation Lead (Playwright/Jest/CI-CD)",
        description: "Lead end-to-end automation test architecture, contract testing, and performance benchmark suites.",
        location: "Remote",
        contractType: "Fixed Contract",
        experienceMin: 4,
        experienceMax: 8,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Embedded Systems & IoT Engineer",
        description: "Design real-time firmware and secure device-to-cloud communication telemetry for edge smart hardware.",
        location: "Gotham City, NY",
        contractType: "Fixed Contract",
        experienceMin: 6,
        experienceMax: 12,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Enterprise Solutions Architect",
        description: "Direct legacy migration initiatives into containerized event-driven microservices with strict multi-tenancy and RBAC.",
        location: "Remote",
        contractType: "C2H",
        experienceMin: 10,
        experienceMax: 18,
        status: OpeningStatus.OPEN,
      },
      {
        title: "UI/UX Product Designer & Design Systems",
        description: "Craft enterprise design systems with Figma, user workflows, and high-fidelity prototypes for contract management tools.",
        location: "Remote",
        contractType: "Full-time Contract",
        experienceMin: 3,
        experienceMax: 7,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Junior Full Stack Developer",
        description: "Assist engineering squads in developing REST APIs, Prisma migrations, and responsive Next.js web interfaces.",
        location: "Remote",
        contractType: "Fixed Contract",
        experienceMin: 1,
        experienceMax: 3,
        status: OpeningStatus.OPEN,
      },
      {
        title: "Site Reliability Engineer (SRE & Observability)",
        description: "Maintain SLA/SLO metrics, APM tracing, alerting stacks, and distributed transaction observability.",
        location: "Gotham City, NY",
        contractType: "C2H",
        experienceMin: 4,
        experienceMax: 8,
        status: OpeningStatus.OPEN,
      },
    ];

    for (const item of openingsData) {
      const existing = await prisma.opening.findFirst({
        where: {
          tenantId: tenant.tenantId,
          title: item.title,
        },
      });

      if (!existing) {
        await prisma.opening.create({
          data: {
            tenantId: tenant.tenantId,
            hiringManagerId: hiringManager.id,
            title: item.title,
            description: item.description,
            location: item.location,
            contractType: item.contractType,
            experienceMin: item.experienceMin,
            experienceMax: item.experienceMax,
            status: item.status,
            expectedCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`  + Seeded opening: "${item.title}"`);
      } else {
        console.log(`  * Opening already exists: "${item.title}"`);
      }
    }

    const totalOpenings = await prisma.opening.count({
      where: { tenantId: tenant.tenantId },
    });

    console.log(`\n🎉 Seeding completed successfully! Total openings: ${totalOpenings}`);
  } catch (error) {
    console.error("❌ Error seeding openings:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedOpenings();
