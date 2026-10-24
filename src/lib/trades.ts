export const TRADES = [
  { id: "mechanic", label: "Mechanic", plural: "Mechanics", icon: "🔧", accreditation: "imi" },
  { id: "plumber", label: "Plumber", plural: "Plumbers", icon: "🚰", accreditation: null },
  { id: "electrician", label: "Electrician", plural: "Electricians", icon: "⚡", accreditation: "niceic" },
  { id: "gas_engineer", label: "Gas engineer", plural: "Gas engineers", icon: "🔥", accreditation: "gas_safe" },
  { id: "carpenter", label: "Carpenter", plural: "Carpenters", icon: "🪚", accreditation: null },
  { id: "locksmith", label: "Locksmith", plural: "Locksmiths", icon: "🔑", accreditation: null },
  { id: "roofer", label: "Roofer", plural: "Roofers", icon: "🏠", accreditation: null },
] as const;

export type TradeId = (typeof TRADES)[number]["id"];

export const TRADE_IDS = TRADES.map((t) => t.id) as [TradeId, ...TradeId[]];

export function tradeInfo(id: string) {
  return TRADES.find((t) => t.id === id) ?? TRADES[0];
}

export function isTradeId(id: unknown): id is TradeId {
  return typeof id === "string" && (TRADE_IDS as string[]).includes(id);
}
