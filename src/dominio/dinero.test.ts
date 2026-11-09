import { describe, expect, it } from "vitest";
import { formatoCOP } from "./dinero";

// Intl usa espacio duro entre el símbolo y el número; se normaliza para comparar.
const limpio = (s: string) => s.replace(/\s/g, " ");

describe("formatoCOP", () => {
  it("formatea pesos sin decimales y con puntos de miles", () => {
    expect(limpio(formatoCOP(1200000))).toBe("$ 1.200.000");
  });

  it("formatea cero", () => {
    expect(limpio(formatoCOP(0))).toBe("$ 0");
  });

  it("formatea negativos", () => {
    expect(limpio(formatoCOP(-22000))).toContain("22.000");
    expect(formatoCOP(-22000)).toContain("-");
  });
});
