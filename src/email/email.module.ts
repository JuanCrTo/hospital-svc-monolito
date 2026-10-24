import { forwardRef, Module } from '@nestjs/common'
import { EmailService } from './email.service'
import { ConfigModule } from '@nestjs/config'
import { HttpModule } from '@nestjs/axios'
import { PatientModule } from 'src/patient/patient.module'
import { UserModule } from 'src/user/user.module'
import { EmailConsumer } from './email.consumer'
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module'

@Module({
  imports: [ConfigModule, HttpModule, PatientModule, RabbitMQModule, forwardRef(() => UserModule)],
  providers: [EmailService, EmailConsumer],
  exports: [EmailService]
})
export class EmailModule {}
