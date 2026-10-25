import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { Medication } from './medication.entity'
import { StockMovement } from './stock-movement.entity'

@Entity('inventory_items')
@Index('uq_inventory_items_lot', ['tenantId', 'facilityId', 'medicationId', 'lotNumber'], { unique: true })
@Index('idx_inventory_items_scope', ['tenantId', 'facilityId'])
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ name: 'facility_id', type: 'uuid' }) facilityId: string
  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'facility_id' }) facility: Facility
  @Column({ name: 'medication_id', type: 'uuid' }) medicationId: string
  @ManyToOne(() => Medication, medication => medication.inventoryItems, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'medication_id' })
  medication: Medication
  @Column({ name: 'lot_number', type: 'varchar', length: 80 }) lotNumber: string
  @Column({ name: 'expires_on', type: 'date' }) expiresOn: string
  @Column({ name: 'quantity_on_hand', type: 'integer', default: 0 }) quantityOnHand: number
  @Column({ name: 'unit_cost', type: 'numeric', precision: 12, scale: 2, nullable: true }) unitCost: string | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date
  @OneToMany(() => StockMovement, movement => movement.inventoryItem) movements: StockMovement[]
}
