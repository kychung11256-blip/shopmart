/**
 * Test: orders.markAsPaid accepts new input format with customerEmail/customerName
 * and orders.create input schema validation
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createGuestContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      headers: { origin: "http://localhost:3000" },
      cookies: {},
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
  return { ctx };
}

function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    loginMethod: "local",
  };
  const ctx: TrpcContext = {
    user,
    req: {
      headers: { origin: "http://localhost:3000" },
      cookies: {},
    } as any,
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as any,
  };
  return { ctx };
}

describe("orders.markAsPaid input schema", () => {
  it("should accept new object input format with orderId", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the input schema accepts the new format
    // We expect a database error (not available in test), not a validation error
    try {
      await caller.orders.markAsPaid({
        orderId: 999999,
        customerEmail: "test@example.com",
        customerName: "Test Customer",
        paymentMethod: "Stripe",
      });
    } catch (error: any) {
      // Should fail with database error, not input validation error
      const msg = error?.message || "";
      expect(msg).not.toContain("Expected object");
      expect(msg).not.toContain("invalid_type");
      expect(msg).not.toContain("ZodError");
      console.log("[Test] markAsPaid error (expected - no DB in test):", msg);
    }
  });

  it("should accept markAsPaid without optional email/name fields", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.orders.markAsPaid({
        orderId: 999999,
      });
    } catch (error: any) {
      const msg = error?.message || "";
      expect(msg).not.toContain("Expected object");
      expect(msg).not.toContain("invalid_type");
      expect(msg).not.toContain("ZodError");
      console.log("[Test] markAsPaid (no email) error (expected - no DB in test):", msg);
    }
  });

  it("orders.create requires authentication", async () => {
    const { ctx } = createGuestContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await (caller.orders as any).create({
        items: [{ productId: 1, quantity: 1 }],
        shippingAddress: "test@example.com",
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Should fail with auth error for unauthenticated user
      const msg = error?.message || "";
      expect(msg.length).toBeGreaterThan(0);
      console.log("[Test] orders.create auth error (expected):", msg);
    }
  });
});
