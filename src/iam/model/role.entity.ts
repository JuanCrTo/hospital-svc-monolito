import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'

export type RoleStatus = 'active' | 'inactive'

@Entity('roles')
@Unique('uq_roles_tenant_code', ['tenantId', 'code'])
@Index('idx_roles_tenant_id', ['tenantId'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'varchar', length: 100 })
  code: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: RoleStatus

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
