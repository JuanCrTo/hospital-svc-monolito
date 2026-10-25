import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { InventoryItem } from './inventory-item.entity'

@Entity('medications')
@Index('uq_medications_tenant_code', ['tenantId', 'code'], { unique: true })
export class Medication {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ type: 'varchar', length: 40 }) code: string
  @Column({ type: 'varchar', length: 255 }) name: string
  @Column({ name: 'active_ingredient', type: 'varchar', length: 255 }) activeIngredient: string
  @Column({ type: 'varchar', length: 100 }) concentration: string
  @Column({ name: 'unit_of_measure', type: 'varchar', length: 30 }) unitOfMeasure: string
  @Column({ type: 'varchar', length: 20, default: 'active' }) status: 'active' | 'inactive'
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date
  @OneToMany(() => InventoryItem, item => item.medication) inventoryItems: InventoryItem[]
}
