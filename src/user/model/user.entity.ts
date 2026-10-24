import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { UserRole } from '../enums/user-role.enum'

export type UserStatus = 'active' | 'inactive' | 'locked'

@Entity('users')
@Index('idx_users_email', ['email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 320 })
  email: string

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string

  @Column({ type: 'varchar', length: 20, default: 'patient' })
  role: UserRole

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: UserStatus

  @Column({ name: 'is_platform_admin', type: 'boolean', default: false })
  isPlatformAdmin: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
