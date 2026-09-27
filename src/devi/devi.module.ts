import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeviController } from './devi.controller';
import { DeviService } from './devi.service';

@Module({ imports: [AuthModule], controllers: [DeviController], providers: [DeviService] })
export class DeviModule {}
