import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { CreateResponseDto } from './dto/create-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateResponseDto } from './dto/update-response.dto';

@Controller('surveys/:surveyId/responses')
@UseGuards(JwtAuthGuard)
export class ResponsesController {
  constructor(private responsesService: ResponsesService) {}

  @Post()
  create(
    @Param('surveyId') surveyId: string,
    @Body() dto: CreateResponseDto,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.create(surveyId, user.id, user.role, dto);
  }

  @Get('me')
  hasResponded(
    @Param('surveyId') surveyId: string,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.hasResponded(surveyId, user.id);
  }

  @Get()
  list(@Param('surveyId') surveyId: string, @CurrentUser() user: any) {
    return this.responsesService.listBySurvey(surveyId, user.id, user.role);
  }

  @Get(':responseId')
  findOne(
    @Param('surveyId') surveyId: string,
    @Param('responseId') responseId: string,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.findOneBySurvey(surveyId, responseId, user.id, user.role);
  }

  @Patch(':responseId')
  update(
    @Param('surveyId') surveyId: string,
    @Param('responseId') responseId: string,
    @Body() dto: UpdateResponseDto,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.update(surveyId, responseId, user.id, user.role, dto);
  }

  @Delete(':responseId')
  delete(
    @Param('surveyId') surveyId: string,
    @Param('responseId') responseId: string,
    @CurrentUser() user: any,
  ) {
    return this.responsesService.delete(surveyId, responseId, user.id, user.role);
  }
}
