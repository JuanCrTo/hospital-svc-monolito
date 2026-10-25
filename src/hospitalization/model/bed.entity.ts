import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
@Entity('beds')
@Index('uq_beds_tenant_facility_code', ['tenantId', 'facilityId', 'code'], { unique: true })
export class Bed {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ name: 'facility_id', type: 'uuid' }) facilityId: string
  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'facility_id' }) facility: Facility
  @Column({ type: 'varchar', length: 40 }) code: string
  @Column({ type: 'varchar', length: 80 }) ward: string
  @Column({ type: 'varchar', length: 20, default: 'available' }) status: 'available' | 'maintenance'
}
