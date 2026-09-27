import { ForbiddenException } from '@nestjs/common';

/** A profile ID supplied by the client must always match the authenticated JWT subject. */
export function assertProfileAccess(authenticatedProfileId: string, requestedProfileId: string): void {
  if (authenticatedProfileId !== requestedProfileId) {
    throw new ForbiddenException('No tienes permiso para acceder a los datos de otro usuario');
  }
}
