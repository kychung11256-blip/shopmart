/**
 * Test: Pagination logic for AdminOrders
 * Validates that the pagination calculation is correct
 */
import { describe, expect, it } from "vitest";

const PAGE_SIZE = 40;

function paginate<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return { paginated, totalPages, safePage };
}

describe("AdminOrders Pagination Logic", () => {
  it("should return all items on page 1 when total <= 40", () => {
    const items = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
    const { paginated, totalPages, safePage } = paginate(items, 1);
    expect(paginated.length).toBe(25);
    expect(totalPages).toBe(1);
    expect(safePage).toBe(1);
  });

  it("should return 40 items on page 1 when total > 40", () => {
    const items = Array.from({ length: 85 }, (_, i) => ({ id: i + 1 }));
    const { paginated, totalPages } = paginate(items, 1);
    expect(paginated.length).toBe(40);
    expect(totalPages).toBe(3);
    expect(paginated[0].id).toBe(1);
    expect(paginated[39].id).toBe(40);
  });

  it("should return correct items on page 2", () => {
    const items = Array.from({ length: 85 }, (_, i) => ({ id: i + 1 }));
    const { paginated, safePage } = paginate(items, 2);
    expect(paginated.length).toBe(40);
    expect(safePage).toBe(2);
    expect(paginated[0].id).toBe(41);
    expect(paginated[39].id).toBe(80);
  });

  it("should return remaining items on last page", () => {
    const items = Array.from({ length: 85 }, (_, i) => ({ id: i + 1 }));
    const { paginated, totalPages } = paginate(items, 3);
    expect(paginated.length).toBe(5);
    expect(totalPages).toBe(3);
    expect(paginated[0].id).toBe(81);
    expect(paginated[4].id).toBe(85);
  });

  it("should clamp page to totalPages when page exceeds total", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
    const { safePage, totalPages } = paginate(items, 99);
    expect(totalPages).toBe(2);
    expect(safePage).toBe(2);
  });

  it("should return 1 page when list is empty", () => {
    const { paginated, totalPages, safePage } = paginate([], 1);
    expect(paginated.length).toBe(0);
    expect(totalPages).toBe(1);
    expect(safePage).toBe(1);
  });

  it("should return exactly 40 items when total is exactly 40", () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ id: i + 1 }));
    const { paginated, totalPages } = paginate(items, 1);
    expect(paginated.length).toBe(40);
    expect(totalPages).toBe(1);
  });

  it("should return 2 pages when total is 41", () => {
    const items = Array.from({ length: 41 }, (_, i) => ({ id: i + 1 }));
    const { totalPages } = paginate(items, 1);
    expect(totalPages).toBe(2);
  });
});
