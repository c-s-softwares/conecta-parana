export const ENTITY_TYPES = {
  EVENT: 'event',
  LOCAL: 'local',
  TICKET: 'ticket',
  NEWS: 'news',
  COMMUNICATE: 'communicate',
  USER_AVATAR: 'user_avatar',
} as const;

export type EntityType = (typeof ENTITY_TYPES)[keyof typeof ENTITY_TYPES];

export const ENTITY_TYPE_VALUES = Object.values(ENTITY_TYPES);

export const ENTITY_TYPES_REQUIRING_ID: EntityType[] = [
  ENTITY_TYPES.EVENT,
  ENTITY_TYPES.LOCAL,
  ENTITY_TYPES.TICKET,
  ENTITY_TYPES.NEWS,
  ENTITY_TYPES.COMMUNICATE,
];
