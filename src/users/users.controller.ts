import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AddressDto } from './dto/address.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../media/media.service';
import { UserRole } from './schemas/user.schema';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get current user profile with addresses' })
  async getProfile(@Req() req: any) {
    return this.usersService.findByFirebaseUid(req.user.uid);
  }

  @Post('addresses')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Add a new shipping address' })
  async addAddress(@Req() req: any, @Body() addressDto: AddressDto) {
    return this.usersService.addAddress(req.user.uid, addressDto);
  }

  @Post('avatar')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload user profile avatar' })
  async uploadAvatar(@Req() req: any, @UploadedFile() file: any) {
    const avatarUrls = await this.mediaService.uploadFile(file, 'avatars');
    return this.usersService.updateAvatar(req.user.uid, avatarUrls);
  }

  @Delete('addresses/:id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Remove a shipping address' })
  async removeAddress(@Req() req: any, @Param('id') id: string) {
    return this.usersService.removeAddress(req.user.uid, id);
  }
}
