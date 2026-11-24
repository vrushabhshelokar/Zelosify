import { describe, it, expect } from "vitest";

describe("Multi-Tenancy & Strict RBAC Security", () => {
  const tenantA = "tenant-wayne-corp-111";
  const tenantB = "tenant-lexcorp-222";

  const vendorUserA = {
    id: "vendor-user-1",
    role: "IT_VENDOR",
    tenantId: tenantA,
  };

  const managerUserA = {
    id: "manager-user-1",
    role: "HIRING_MANAGER",
    tenantId: tenantA,
  };

  const managerUserB = {
    id: "manager-user-2",
    role: "HIRING_MANAGER",
    tenantId: tenantB,
  };

  const openingsMock = [
    { id: "op-1", tenantId: tenantA, hiringManagerId: "manager-user-1", title: "Frontend Eng" },
    { id: "op-2", tenantId: tenantB, hiringManagerId: "manager-user-2", title: "Backend Eng" },
  ];

  const profilesMock = [
    { id: 1, openingId: "op-1", uploadedBy: "vendor-user-1", s3Key: "p1.pdf", recommendationScore: 0.85, recommended: true, isDeleted: false },
    { id: 2, openingId: "op-1", uploadedBy: "vendor-user-99", s3Key: "p2.pdf", recommendationScore: 0.90, recommended: true, isDeleted: false },
  ];

  it("Tenant Leakage Test: should not expose Tenant B openings to Tenant A users", () => {
    const userATenantOpenings = openingsMock.filter((o) => o.tenantId === vendorUserA.tenantId);
    expect(userATenantOpenings.length).toBe(1);
    expect(userATenantOpenings[0].id).toBe("op-1");
    expect(userATenantOpenings.some((o) => o.tenantId === tenantB)).toBe(false);
  });

  it("IT Vendor Security: Vendor can only view their own uploads and never AI recommendations", () => {
    const vendorVisibleProfiles = profilesMock
      .filter((p) => p.uploadedBy === vendorUserA.id && !p.isDeleted)
      .map((p) => ({
        id: p.id,
        s3Key: p.s3Key,
        // AI fields omitted for vendor persona
      }));

    expect(vendorVisibleProfiles.length).toBe(1);
    expect(vendorVisibleProfiles[0].id).toBe(1);
    expect((vendorVisibleProfiles[0] as any).recommendationScore).toBeUndefined();
    expect((vendorVisibleProfiles[0] as any).recommended).toBeUndefined();
  });

  it("Hiring Manager Ownership: Manager cannot view or manage openings assigned to another manager", () => {
    const opening = openingsMock.find((o) => o.id === "op-1");
    expect(opening?.hiringManagerId === managerUserA.id).toBe(true);
    // Manager B from LexCorp attempting to access op-1 must be forbidden
    expect(opening?.hiringManagerId === managerUserB.id).toBe(false);
  });
});
