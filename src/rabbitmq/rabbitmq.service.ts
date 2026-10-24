import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import * as amqp from 'amqplib'
import { Channel, Connection } from 'amqplib'

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private conn: Connection | null = null
  private ch: Channel | null = null

  // Nombres de las colas
  public static readonly QUEUES = {
    FORGOT_PASSWORD: 'forgot_password_email_queue',
    WELCOME: 'welcome_email_queue',
    INVITATION: 'invitation_email_queue'
  } as const

  public get channel(): Channel {
    if (!this.ch) {
      throw new Error('RabbitMQ channel not initialized')
    }
    return this.ch
  }

  public get connection(): Connection {
    if (!this.conn) {
      throw new Error('RabbitMQ connection not established')
    }
    return this.conn
  }

  async onModuleInit() {
    try {
      this.conn = await amqp.connect(process.env.RABBITMQ_URL)
      this.ch = await this.conn.createChannel()

      // Configuración de ambas colas
      await this.ch.assertQueue(RabbitMQService.QUEUES.FORGOT_PASSWORD, { durable: true })
      await this.ch.assertQueue(RabbitMQService.QUEUES.WELCOME, { durable: true })
      await this.ch.assertQueue(RabbitMQService.QUEUES.INVITATION, { durable: true })

      console.log('RabbitMQ connected and channels created for both email types')
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error)
      throw error
    }
  }

  async onModuleDestroy() {
    try {
      if (this.ch) {
        await this.ch.close()
        this.ch = null
      }
      if (this.conn) {
        await this.conn.close()
        this.conn = null
      }
      console.log('RabbitMQ connection closed')
    } catch (error) {
      console.error('Error closing RabbitMQ connection:', error)
    }
  }

  async publish(queue: string, message: any) {
    if (!this.ch) {
      throw new Error('Channel not available')
    }

    console.log(`Publishing to queue ${queue}:`, JSON.stringify(message, null, 2))

    this.ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
      persistent: true
    })
  }

  async consume(queue: string, callback: (msg: amqp.ConsumeMessage | null) => void) {
    if (!this.ch) {
      throw new Error('Channel not available')
    }
    await this.ch.consume(queue, callback, { noAck: false })
  }
}
