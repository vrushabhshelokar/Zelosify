import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  presignProfileUploads,
  submitProfiles,
} from "../../src/controllers/vendor/contractVendorController.js";
import {
  getOpeningProfiles,
  shortlistProfile,
  rejectProfile,
} from "../../src/controllers/hiring/contractHiringManagerController.js";
import { processProfileRecommendation } from "../../src/services/ai/recommendationService.js";

// In-memory test store simulating PostgreSQL database
const databaseStore = {
  openings: [
    {
      id: "op-integration-1",
      tenantId: "tenant-bruce-wayne",
      title: "Senior Full Stack Engineer (React/Node)",
      description: "Require expertise in React, Node.js, and TypeScript with 5+ years experience.",
      location: "Remote",
      contractType: "C2H",
      experienceMin: 5,
      experienceMax: 9,
      hiringManagerId: "manager-rachel",
      postedDate: new Date(),
      status: "OPEN",
    },
  ],
  profiles: [] as any[],
  users: [
    { id: "manager-rachel", firstName: "Rachel", lastName: "Dawes", username: "rachel" },
    { id: "vendor-lucius", firstName: "Lucius", lastName: "Fox", username: "lucius" },
  ],
};

// Mock Prisma client with in-memory transaction simulation
vi.mock("../../src/config/prisma/prisma.js", () => {
  return {
    default: {
      opening: {
        findFirst: vi.fn(({ where }) => {
          const found = databaseStore.openings.find((o) => {
            if (where.id && o.id !== where.id) return false;
            if (where.tenantId && o.tenantId !== where.tenantId) return false;
            return true;
          });
          return Promise.resolve(found || null);
        }),
        findMany: vi.fn(() => Promise.resolve(databaseStore.openings)),
      },
      user: {
        findUnique: vi.fn(({ where }) => {
          const user = databaseStore.users.find((u) => u.id === where.id);
          return Promise.resolve(user || null);
        }),
      },
      hiringProfile: {
        findUnique: vi.fn(({ where }) => {
          const profile = databaseStore.profiles.find((p) => p.id === where.id);
          if (profile) {
            const opening = databaseStore.openings.find((o) => o.id === profile.openingId);
            return Promise.resolve({ ...profile, opening });
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn(({ where }) => {
          const filtered = databaseStore.profiles.filter((p) => {
            if (where.openingId && p.openingId !== where.openingId) return false;
            if (where.isDeleted !== undefined && p.isDeleted !== where.isDeleted) return false;
            return true;
          });
          return Promise.resolve(filtered);
        }),
        create: vi.fn(({ data }) => {
          const newProfile = {
            id: databaseStore.profiles.length + 1,
            ...data,
            submittedAt: new Date(),
            isDeleted: false,
          };
          databaseStore.profiles.push(newProfile);
          return Promise.resolve(newProfile);
        }),
        update: vi.fn(({ where, data }) => {
          const profile = databaseStore.profiles.find((p) => p.id === where.id);
          if (!profile) throw new Error("Profile not found");
          Object.assign(profile, data);
          return Promise.resolve(profile);
        }),
      },
      $transaction: vi.fn(async (callback) => {
        return await callback({
          hiringProfile: {
            create: vi.fn(({ data }) => {
              const newProfile = {
                id: databaseStore.profiles.length + 1,
                ...data,
                submittedAt: new Date(),
                isDeleted: false,
              };
              databaseStore.profiles.push(newProfile);
              return Promise.resolve(newProfile);
            }),
            update: vi.fn(({ where, data }) => {
              const profile = databaseStore.profiles.find((p) => p.id === where.id);
              if (!profile) throw new Error("Profile not found");
              Object.assign(profile, data);
              return Promise.resolve(profile);
            }),
          },
        });
      }),
    },
  };
});

describe("Phase 6: Full Contract Hiring Integration Flow", () => {
  beforeEach(() => {
    databaseStore.profiles = [];
  });

  const createMockRes = () => {
    const res: any = {
      statusCode: 200,
      body: null,
      status: vi.fn(function (code) {
        res.statusCode = code;
        return this;
      }),
      json: vi.fn(function (data) {
        res.body = data;
        return this;
      }),
      setHeader: vi.fn(),
      send: vi.fn(),
    };
    return res;
  };

  it("should execute complete integration lifecycle: Presign -> Submit -> Recommend -> Shortlist", async () => {
    console.log("▶ Step 1: IT Vendor requests S3 Presigned upload URL");
    const presignReq = {
      params: { id: "op-integration-1" },
      user: { id: "vendor-lucius", tenantId: "tenant-bruce-wayne" },
      body: {
        files: [{ fileName: "alex_mercer_resume.pdf", contentType: "application/pdf" }],
      },
    } as any;
    const presignRes = createMockRes();

    await presignProfileUploads(presignReq, presignRes);

    expect(presignRes.statusCode).toBe(200);
    expect(presignRes.body.success).toBe(true);
    expect(presignRes.body.data.length).toBe(1);

    const generatedS3Key = presignRes.body.data[0].s3Key;
    expect(generatedS3Key).toMatch(/^zel-recruit\/tenant-bruce-wayne\/op-integration-1\/\d+_alex_mercer_resume\.pdf$/);
    console.log(`  ✓ Presigned key generated: ${generatedS3Key}`);

    console.log("▶ Step 2: IT Vendor submits uploaded profile within a Prisma transaction");
    const submitReq = {
      params: { id: "op-integration-1" },
      user: { id: "vendor-lucius", tenantId: "tenant-bruce-wayne" },
      body: {
        profiles: [
          {
            s3Key: generatedS3Key,
            fileName: "alex_mercer_resume.pdf",
            resumeText: "Alex Mercer. 7 years experience in React, Node.js, TypeScript, and AWS. Location: Remote.",
          },
        ],
      },
    } as any;
    const submitRes = createMockRes();

    await submitProfiles(submitReq, submitRes);

    expect(submitRes.statusCode).toBe(201);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.data.length).toBe(1);

    const submittedProfileId = submitRes.body.data[0].id;
    expect(submittedProfileId).toBeDefined();
    console.log(`  ✓ Candidate profile #${submittedProfileId} created with status SUBMITTED`);

    console.log("▶ Step 3: Trigger AI Recommendation Agent evaluation pipeline");
    const resumeText = "Alex Mercer. 7 years experience in React, Node.js, TypeScript, and AWS. Location: Remote.";
    const evalResult = await processProfileRecommendation(
      submittedProfileId,
      resumeText,
      "alex_mercer_resume.pdf"
    );

    expect(evalResult).not.toBeNull();
    expect(evalResult?.result.recommended).toBe(true);
    expect(evalResult?.result.score).toBeGreaterThanOrEqual(0.75);
    expect(evalResult?.result.latencyMs).toBeLessThanOrEqual(1500); // Strict latency SLA
    console.log(`  ✓ AI Agent Recommendation: Score=${evalResult?.result.score}, Recommended=${evalResult?.result.recommended}, Latency=${evalResult?.result.latencyMs}ms`);

    console.log("▶ Step 4: Hiring Manager reviews candidate profiles for their requisition");
    const getProfilesReq = {
      params: { id: "op-integration-1" },
      user: { id: "manager-rachel", tenantId: "tenant-bruce-wayne" },
    } as any;
    const getProfilesRes = createMockRes();

    await getOpeningProfiles(getProfilesReq, getProfilesRes);

    expect(getProfilesRes.statusCode).toBe(200);
    expect(getProfilesRes.body.data.profiles.length).toBe(1);

    const profileCard = getProfilesRes.body.data.profiles[0];
    expect(profileCard.id).toBe(submittedProfileId);
    expect(profileCard.fileName).toBe("alex_mercer_resume.pdf");
    expect(profileCard.recommendationBadge).toBe("Recommended");
    expect(profileCard.scorePercent).toBeGreaterThanOrEqual(75);
    expect(profileCard.explanation.length).toBeGreaterThan(10);
    console.log(`  ✓ Profile card rendered: Badge="${profileCard.recommendationBadge}", Score=${profileCard.scorePercent}%`);

    console.log("▶ Step 5: Hiring Manager shortlists candidate");
    const shortlistReq = {
      params: { id: String(submittedProfileId) },
      user: { id: "manager-rachel" },
    } as any;
    const shortlistRes = createMockRes();

    await shortlistProfile(shortlistReq, shortlistRes);

    expect(shortlistRes.statusCode).toBe(200);
    expect(shortlistRes.body.success).toBe(true);

    const storedProfile = databaseStore.profiles.find((p) => p.id === submittedProfileId);
    expect(storedProfile.status).toBe("SHORTLISTED");
    expect(storedProfile.shortlistedBy).toBe("manager-rachel");
    expect(storedProfile.shortlistedAt).toBeDefined();
    console.log(`  ✓ Candidate profile #${submittedProfileId} state transitioned to SHORTLISTED`);

    console.log("🎉 Full Contract Hiring Integration Flow completed with 100% success!");
  });

  it("should enforce unauthorized access protection when different hiring manager attempts decision", async () => {
    // Stage a candidate profile
    databaseStore.profiles.push({
      id: 55,
      openingId: "op-integration-1",
      s3Key: "zel-recruit/tenant-bruce-wayne/op-integration-1/1000_jane.pdf",
      uploadedBy: "vendor-lucius",
      status: "SUBMITTED",
      isDeleted: false,
    });

    const unauthorizedManagerReq = {
      params: { id: "55" },
      user: { id: "unauthorized-manager-lexcorp" },
    } as any;
    const res = createMockRes();

    await shortlistProfile(unauthorizedManagerReq, res);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("Forbidden");
  });
});
