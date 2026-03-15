import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateSurveyDto } from './dto/create-survey.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  UpdateSurveyDto,
} from './dto/update-survey.dto';

@Controller('surveys')
@UseGuards(JwtAuthGuard)
export class SurveysController {
  constructor(private surveysService: SurveysService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  create(@Body() dto: CreateSurveyDto, @CurrentUser() user: any) {
    return this.surveysService.create(dto, user.id);
  }

  @Get()
  findAvailable(@CurrentUser() user: any) {
    if (user.role === 'ADMIN') return this.surveysService.findAll();
    return this.surveysService.findAvailable(user.id, user.role);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.surveysService.findOne(id, user.id, user.role);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSurveyDto,
    @CurrentUser() user: any,
  ) {
    return this.surveysService.update(id, dto, user.id, user.role);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.surveysService.delete(id, user.id, user.role);
  }

  @Post(':id/questions')
  addQuestion(
    @Param('id') id: string,
    @Body() dto: CreateQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.surveysService.addQuestion(id, dto, user.id, user.role);
  }

  @Patch(':id/questions/:questionId')
  updateQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionDto,
    @CurrentUser() user: any,
  ) {
    return this.surveysService.updateQuestion(id, questionId, dto, user.id, user.role);
  }

  @Delete(':id/questions/:questionId')
  deleteQuestion(
    @Param('id') id: string,
    @Param('questionId') questionId: string,
    @CurrentUser() user: any,
  ) {
    return this.surveysService.deleteQuestion(id, questionId, user.id, user.role);
  }

  @Get(':id/results')
  getResults(@Param('id') id: string, @CurrentUser() user: any) {
    return this.surveysService.getResults(id, user.id, user.role);
  }
}
