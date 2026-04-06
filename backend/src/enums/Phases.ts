export const Phases = {
    active: "active",
    soldout: "soldout",
    upcoming: "upcoming",
} as const;

export type Phase = typeof Phases[keyof typeof Phases];