import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AskDeviDto } from './dto/ask-devi.dto';
import { DeviService } from './devi.service';

@ApiTags('Devi')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('devi')
export class DeviController {
  constructor(private readonly deviService: DeviService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Enviar una pregunta al agente Devi' })
  ask(@Body() dto: AskDeviDto) { return this.deviService.ask(dto.message); }
}
