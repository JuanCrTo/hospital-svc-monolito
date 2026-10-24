import { forwardRef, Inject, Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { PatientService } from 'src/patient/patient.service'
import { UserService } from 'src/user/user.service'
import { RabbitMQService } from 'src/rabbitmq/rabbitmq.service'
import { ForgotPasswordEmailData, InvitationEmailData, WelcomeEmailData } from 'src/email/interfaces/email.interface'

@Injectable()
export class EmailService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly patientService: PatientService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly rabbitMQService: RabbitMQService
  ) {}

  async sendEmailForgotPassword(userId: string, resetLink: string) {
    try {
      const user = await this.userService.findById(userId)

      if (!user || !user.email) {
        throw new Error('User not found or email missing')
      }

      const emailData: ForgotPasswordEmailData = {
        type: 'forgot-password',
        to: user.email,
        subject: 'Password Reset - Hospital Yellow',
        resetLink: resetLink
      }

      console.log('Sending forgot password email data:', emailData)

      // Enviar a la cola específica de forgot-password
      await this.rabbitMQService.publish(RabbitMQService.QUEUES.FORGOT_PASSWORD, emailData)

      return {
        message: 'Forgot password email queued successfully',
        emailSentTo: user.email
      }
    } catch (error) {
      console.error('Error queuing forgot password email:', error)
      throw error
    }
  }

  async sendInvitationEmail(email: string, inviteLink: string): Promise<{ message: string; emailSentTo: string }> {
    const emailData: InvitationEmailData = {
      type: 'invitation',
      to: email,
      subject: 'Invitación al Hospital Yellow',
      inviteLink
    }

    await this.rabbitMQService.publish(RabbitMQService.QUEUES.INVITATION, emailData)

    return {
      message: 'Invitation email queued successfully',
      emailSentTo: email
    }
  }

  async sendEmailWelcome(userId: string): Promise<any> {
    try {
      const user = await this.userService.findById(userId)

      if (!user || !user.email) {
        throw new Error('User not found or email missing')
      }

      const tipo = user.role
      let name: string

      switch (tipo) {
        case 'patient':
          const patient = await this.patientService.findByUserId(userId)
          name = patient?.firstname || 'Paciente'
          break
        // case 'doctor':
        //   const doctor = await this.doctorService.findByUserId(userId);
        //   name = doctor?.firstname || 'Doctor';
        //   break;
        // case 'nurse':
        //   const nurse = await this.nurseService.findByUserId(userId);
        //   name = nurse?.firstname || 'Enfermero/a';
        //   break;
        default:
          name = 'Usuario'
      }

      const emailData: WelcomeEmailData = {
        type: 'welcome',
        to: user.email,
        subject: 'Bienvenido al Hospital Yellow',
        firstname: name
      }

      console.log('Sending welcome email data:', emailData)

      // Enviar a la cola específica de welcome
      await this.rabbitMQService.publish(RabbitMQService.QUEUES.WELCOME, emailData)

      return {
        message: 'Welcome email queued successfully',
        emailSentTo: user.email
      }
    } catch (error) {
      console.error('Error queuing welcome email:', error)
      throw error
    }
  }
}
