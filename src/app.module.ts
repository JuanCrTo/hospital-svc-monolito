import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DoctorModule } from './doctor/doctor.module'
import { UserModule } from './user/user.module'
import { NurseModule } from './nurse/nurse.module'
import { PatientModule } from './patient/patient.module'
import { AppointmentModule } from './appointment/appointment.module'
import { MedicalRecordModule } from './medical-record/medical-record.module'
import { MedicineModule } from './medicine/medicine.module'
import { AuthModule } from './auth/auth.module'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '@nestjs/config'
import { MongooseConfigService } from './mongoose-config/mongoose-config.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TypeOrmConfigService } from './typeorm-config/typeorm-config.service'
import { EmailModule } from './email/email.module'
import { PdfModule } from './pdf/pdf.module'
import { RabbitMQModule } from './rabbitmq/rabbitmq.module'
import { LoggerModule } from './common/logging/logger.module'
import { HealthModule } from './health/health.module'
import { IamModule } from './iam/iam.module'
import { RlsModule } from './common/rls/rls.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    RlsModule,
    LoggerModule,
    HealthModule,
    IamModule,
    MongooseModule.forRootAsync({ useClass: MongooseConfigService }),
    DoctorModule,
    UserModule,
    NurseModule,
    PatientModule,
    AppointmentModule,
    MedicalRecordModule,
    MedicineModule,
    AuthModule,
    EmailModule,
    PdfModule,
    RabbitMQModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
