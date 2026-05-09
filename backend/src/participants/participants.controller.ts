import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from '../users/user.entity';
import { InviteParticipantDto } from './dto';
import {
  InvitationResponseDto,
  ParticipantResponseDto,
} from './participant-response.dto';
import { ParticipantsService } from './participants.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Get('invitations')
  async findInvitations(@CurrentUser() user: User) {
    const invitations = await this.participantsService.findInvitations(user);
    return invitations.map(
      (invitation) => new InvitationResponseDto(invitation, user),
    );
  }

  @Post('events/:eventId/participants')
  async invite(
    @Param('eventId') eventId: string,
    @Body() dto: InviteParticipantDto,
    @CurrentUser() user: User,
  ) {
    const participant = await this.participantsService.invite(
      eventId,
      dto.userId,
      user,
    );
    return new ParticipantResponseDto(participant);
  }

  @Get('events/:eventId/participants')
  async findPublicList(
    @Param('eventId') eventId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.participantsService.findPublicList(eventId, user);
    return [
      ParticipantResponseDto.organizer(result.event),
      ...result.participants.map(
        (participant) => new ParticipantResponseDto(participant),
      ),
    ];
  }

  @Get('events/:eventId/participants/manage')
  async findManageList(
    @Param('eventId') eventId: string,
    @CurrentUser() user: User,
  ) {
    const result = await this.participantsService.findManageList(eventId, user);
    return result.participants.map(
      (participant) => new ParticipantResponseDto(participant),
    );
  }

  @Post('events/:eventId/participants/:userId/accept')
  async accept(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    const participant = await this.participantsService.accept(
      eventId,
      userId,
      user,
    );
    return new ParticipantResponseDto(participant);
  }

  @Post('events/:eventId/participants/:userId/decline')
  async decline(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    const participant = await this.participantsService.decline(
      eventId,
      userId,
      user,
    );
    return new ParticipantResponseDto(participant);
  }

  @Post('events/:eventId/participants/:userId/leave')
  async leave(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    const participant = await this.participantsService.leave(
      eventId,
      userId,
      user,
    );
    return new ParticipantResponseDto(participant);
  }

  @Delete('events/:eventId/participants/:userId')
  async remove(
    @Param('eventId') eventId: string,
    @Param('userId') userId: string,
    @CurrentUser() user: User,
  ) {
    const participant = await this.participantsService.remove(
      eventId,
      userId,
      user,
    );
    return new ParticipantResponseDto(participant);
  }
}
