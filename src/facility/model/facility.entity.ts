import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'

export type FacilityStatus = 'active' | 'inactive'

@Entity('facilities')
@Unique('uq_facilities_tenant_code', ['tenantId', 'code'])
@Index('idx_facilities_tenant_id', ['tenantId'])
export class Facility {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, tenant => tenant.facilities, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ type: 'varchar', length: 200 })
  name: string

  @Column({ type: 'varchar', length: 50 })
  code: string

  @Column({ type: 'varchar', length: 64, default: 'America/Bogota' })
  timezone: string

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: FacilityStatus

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
