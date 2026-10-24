import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { Facility } from '../../facility/model/facility.entity'
import { Tenant } from '../../tenant/model/tenant.entity'

export type DepartmentStatus = 'active' | 'inactive'

@Entity('departments')
@Unique('uq_departments_tenant_facility_code', ['tenantId', 'facilityId', 'code'])
@Index('idx_departments_tenant_id', ['tenantId'])
@Index('idx_departments_facility_id', ['facilityId'])
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'facility_id', type: 'uuid' })
  facilityId: string

  @ManyToOne(() => Facility, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'facility_id' })
  facility: Facility

  @Column({ type: 'varchar', length: 200 })
  name: string

  @Column({ type: 'varchar', length: 50 })
  code: string

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: DepartmentStatus

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
