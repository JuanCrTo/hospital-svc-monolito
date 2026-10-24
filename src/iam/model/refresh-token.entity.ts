import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { UserEntity } from '../../user/model/user.entity'

@Entity('refresh_tokens')
@Index('idx_refresh_tokens_user_id', ['userId'])
@Index('idx_refresh_tokens_family_id', ['familyId'])
@Index('uq_refresh_tokens_token_hash', ['tokenHash'], { unique: true })
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ name: 'token_hash', type: 'varchar', length: 128 })
  tokenHash: string

  @Column({ name: 'family_id', type: 'uuid' })
  familyId: string

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId: string | null

  @Column({ name: 'facility_id', type: 'uuid', nullable: true })
  facilityId: string | null

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null

  @Column({ name: 'replaced_by_token_id', type: 'uuid', nullable: true })
  replacedByTokenId: string | null

  @Column({ name: 'ip', type: 'varchar', length: 64, nullable: true })
  ip: string | null

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
