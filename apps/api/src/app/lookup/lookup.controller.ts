import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { LookupService } from './lookup.service';

const parsePositiveInt = (
  raw: string | undefined,
  fallback: number,
  max?: number,
) => {
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  const truncated = Math.trunc(n);
  return max ? Math.min(truncated, max) : truncated;
};

@ApiTags('lookups')
@Controller('lookups')
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all public lookup groups' })
  getAll() {
    return this.lookupService.getAllPublic();
  }

  @Public()
  @Get(':key')
  @ApiOperation({ summary: 'Get a lookup group by key' })
  getByKey(@Param('key') key: string) {
    return this.lookupService.getByKey(key);
  }

  // ─── Admin endpoints ──────────────────────────────────────────

  @Get('admin/groups')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Paginated lookup groups incl. non-public (admin)' })
  getGroupsPaginated(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: string,
    @Query('dir') dir?: string,
  ) {
    return this.lookupService.getGroupsPaginated(
      parsePositiveInt(page, 1),
      parsePositiveInt(limit, 20, 100),
      q?.trim() || undefined,
      sort,
      dir === 'desc' ? 'desc' : 'asc',
    );
  }

  @Get('admin/group/:key')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Get a group incl. inactive values (admin)' })
  getGroupAdmin(@Param('key') key: string) {
    return this.lookupService.getGroupAdmin(key);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Create a lookup group (admin)' })
  createGroup(
    @Body()
    body: {
      key: string;
      name: string;
      description?: string;
      isPublic?: boolean;
    },
  ) {
    return this.lookupService.createGroup(body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update a lookup group (admin)' })
  updateGroup(
    @Param('id') id: string,
    @Body() body: { name?: string; description?: string; isPublic?: boolean },
  ) {
    return this.lookupService.updateGroup(id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Delete a lookup group + its values (admin)' })
  deleteGroup(@Param('id') id: string) {
    return this.lookupService.deleteGroup(id);
  }

  @Post(':groupId/values')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Add a value to a lookup group (admin)' })
  addValue(
    @Param('groupId') groupId: string,
    @Body() body: { label: string; value: string; order?: number },
  ) {
    return this.lookupService.addValue(groupId, body);
  }

  @Patch('values/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Update a lookup value (admin)' })
  updateValue(
    @Param('id') id: string,
    @Body()
    body: {
      label?: string;
      value?: string;
      order?: number;
      isActive?: boolean;
    },
  ) {
    return this.lookupService.updateValue(id, body);
  }

  @Delete('values/:id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('access_token')
  @ApiOperation({ summary: 'Delete a lookup value (admin)' })
  deleteValue(@Param('id') id: string) {
    return this.lookupService.deleteValue(id);
  }
}
