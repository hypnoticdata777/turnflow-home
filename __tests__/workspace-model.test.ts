import { describe, expect, it } from "vitest";
import {
  workspaceArchitectureCards,
  workspaceArchitectureFlags,
  workspaceArchitectureSummary,
} from "@/lib/workspace-model";

describe("workspaceArchitectureFlags", () => {
  it("starts incomplete when no workspace primitives exist", () => {
    expect(workspaceArchitectureFlags({})).toEqual({
      hasWorkspace: false,
      hasOwnerMembership: false,
      hasBillingAccount: false,
      hasPaidBillingIntegration: false,
      propertyScopeReady: true,
      requestScopeReady: true,
      billingScopeReady: true,
      foundationReady: false,
    });
  });

  it("marks the foundation ready when the workspace, owner membership, billing account, and record scope are present", () => {
    expect(
      workspaceArchitectureFlags({
        workspace: { id: "workspace-1", name: "Maya's home workspace" },
        memberships: [{ role: "owner", status: "active" }],
        billingAccount: { plan: "poc", status: "trialing" },
        records: {
          properties: 2,
          workspaceProperties: 2,
          requests: 4,
          workspaceRequests: 4,
          billingRecords: 1,
          workspaceBillingRecords: 1,
        },
      })
    ).toMatchObject({
      hasWorkspace: true,
      hasOwnerMembership: true,
      hasBillingAccount: true,
      hasPaidBillingIntegration: false,
      propertyScopeReady: true,
      requestScopeReady: true,
      billingScopeReady: true,
      foundationReady: true,
    });
  });

  it("keeps the foundation in progress until old records are scoped", () => {
    expect(
      workspaceArchitectureFlags({
        workspace: { id: "workspace-1" },
        memberships: [{ role: "owner", status: "active" }],
        billingAccount: { plan: "poc", status: "trialing" },
        records: {
          properties: 2,
          workspaceProperties: 1,
          requests: 3,
          workspaceRequests: 2,
          billingRecords: 1,
          workspaceBillingRecords: 0,
        },
      })
    ).toMatchObject({
      propertyScopeReady: false,
      requestScopeReady: false,
      billingScopeReady: false,
      foundationReady: false,
    });
  });
});

describe("workspaceArchitectureSummary", () => {
  it("explains the ready-for-payments state before provider IDs exist", () => {
    expect(
      workspaceArchitectureSummary({
        workspace: { id: "workspace-1", name: "Maya's home workspace" },
        memberships: [{ role: "owner", status: "active" }],
        billingAccount: { plan: "poc", status: "trialing" },
      })
    ).toEqual({
      headline: "Workspace model is ready for payment wiring.",
      detail:
        "The owner has a workspace, active ownership, scoped records, and a tracked plan. Payment provider IDs are intentionally still empty.",
      tone: "ready",
    });
  });

  it("distinguishes missing billing from missing workspace ownership", () => {
    expect(
      workspaceArchitectureSummary({
        workspace: { id: "workspace-1" },
        memberships: [{ role: "owner", status: "active" }],
      })
    ).toMatchObject({
      headline: "Workspace exists; billing account is next.",
      tone: "progress",
    });

    expect(workspaceArchitectureSummary({})).toMatchObject({
      headline: "Workspace foundation needs setup.",
      tone: "attention",
    });
  });
});

describe("workspaceArchitectureCards", () => {
  it("summarizes workspace, record scope, plan, and billing scope for Account & Sharing", () => {
    const cards = workspaceArchitectureCards({
      workspace: { id: "workspace-1", name: "Maya's home workspace" },
      memberships: [{ role: "owner", status: "active" }],
      billingAccount: { plan: "poc", status: "trialing" },
      records: {
        properties: 2,
        workspaceProperties: 2,
        requests: 5,
        workspaceRequests: 4,
        billingRecords: 1,
        workspaceBillingRecords: 1,
      },
    });

    expect(cards).toEqual([
      expect.objectContaining({
        label: "Workspace",
        value: "Maya's home workspace",
        tone: "ready",
      }),
      expect.objectContaining({
        label: "Record scope",
        value: "2/2",
        tone: "ready",
      }),
      expect.objectContaining({
        label: "Request scope",
        value: "4/5",
        tone: "attention",
      }),
      expect.objectContaining({
        label: "Plan state",
        value: "POC",
        tone: "progress",
      }),
      expect.objectContaining({
        label: "Billing records",
        value: "1/1",
        tone: "ready",
      }),
    ]);
  });
});
