import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Prescription } from './prescription.entity'
import { Medication } from './medication.entity'
@Entity('prescription_lines')
export class PrescriptionLine {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column({ name: 'prescription_id', type: 'uuid' }) prescriptionId: string
  @ManyToOne(() => Prescription, prescription => prescription.lines, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'prescription_id' })
  prescription: Prescription
  @Column({ name: 'medication_id', type: 'uuid' }) medicationId: string
  @ManyToOne(() => Medication, { nullable: false, onDelete: 'RESTRICT' }) @JoinColumn({ name: 'medication_id' }) medication: Medication
  @Column({ type: 'varchar', length: 100 }) dosage: string
  @Column({ type: 'varchar', length: 100 }) frequency: string
  @Column({ type: 'integer' }) quantity: number
  @Column({ type: 'varchar', length: 500, nullable: true }) instructions: string | null
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date
}
