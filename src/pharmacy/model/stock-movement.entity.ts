import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { Facility } from '../../facility/model/facility.entity'
import { UserEntity } from '../../user/model/user.entity'
import { InventoryItem } from './inventory-item.entity'

@Entity('stock_movements')
@Index('idx_stock_movements_scope', ['tenantId', 'facilityId', 'inventoryItemId', 'createdAt'])
export class StockMovement {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'tenant_id', type: 'uuid' }) tenantId: string
  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'tenant_id' }) tenant: Tenant
  @Column({ name: 'facility_id', type: 'uuid' }) facilityId: string
  @ManyToOne(() => Facility, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'facility_id' }) facility: Facility
  @Column({ name: 'inventory_item_id', type: 'uuid' }) inventoryItemId: string
  @ManyToOne(() => InventoryItem, item => item.movements, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventoryItem: InventoryItem
  @Column({ name: 'movement_type', type: 'varchar', length: 20 }) movementType: 'receipt' | 'dispense' | 'adjustment' | 'reversal'
  @Column({ type: 'integer' }) quantity: number
  @Column({ name: 'balance_after', type: 'integer' }) balanceAfter: number
  @Column({ name: 'performed_by', type: 'uuid' }) performedBy: string
  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'performed_by' }) performedByUser: UserEntity
  @Column({ type: 'varchar', length: 500, nullable: true }) reason: string | null
  @Column({ name: 'reference_id', type: 'uuid', nullable: true }) referenceId: string | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
}
