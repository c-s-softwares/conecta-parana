import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export function AdminRoute() {
  return applyDecorators(
    UseGuards(RolesGuard),
    Roles(Role.ADMIN),
    ApiBearerAuth(),
  );
}
