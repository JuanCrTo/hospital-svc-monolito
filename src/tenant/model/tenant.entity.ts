import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Facility } from '../../facility/model/facility.entity'

export type TenantStatus = 'active' | 'inactive' | 'suspended'

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 200 })
  name: string

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: TenantStatus

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date

  @OneToMany(() => Facility, facility => facility.tenant)
  facilities: Facility[]
}
