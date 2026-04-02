export const ROLE_NAMES = [
  "system-admin",
  "project-manager",
  "regular-user",
  "guest",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];

/** Roles that can be assigned/removed via the admin UI (system-admin is excluded) */
export const ASSIGNABLE_ROLES: RoleName[] = [
  "project-manager",
  "regular-user",
  "guest",
];
