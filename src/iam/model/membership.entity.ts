import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { UserEntity } from '../../user/model/user.entity'

export type MembershipStatus = 'active' | 'suspended' | 'revoked'

@Entity('memberships')
@Unique('uq_memberships_user_tenant', ['userId', 'tenantId'])
@Index('idx_memberships_tenant_id', ['tenantId'])
@Index('idx_memberships_user_id', ['userId'])
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: MembershipStatus

  @Column({ name: 'permissions_version', type: 'integer', default: 1 })
  permissionsVersion: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
