import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';
export const PLATFORM_ADMIN_ONLY = 'platformAdminOnly';

/**
 * Every route requires a signed-in user unless marked with this. Use it only for routes that are
 * open by design (login, guest booking) or that authenticate another way (API key).
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Restricts a route or controller to platform admins. */
export const PlatformAdminOnly = () => SetMetadata(PLATFORM_ADMIN_ONLY, true);
