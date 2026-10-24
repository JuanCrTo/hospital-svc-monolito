import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'
import { Tenant } from '../../tenant/model/tenant.entity'
import { UserEntity } from '../../user/model/user.entity'
import { PatientLocationHistory } from './patient-location-history.entity'

const decimalTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | null): number | null => (value === null ? null : Number(value))
}

@Entity('patients')
@Unique('uq_patients_tenant_user', ['tenantId', 'userId'])
@Unique('uq_patients_tenant_identification', ['tenantId', 'identification'])
@Index('idx_patients_tenant_id', ['tenantId'])
export class PatientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string

  @ManyToOne(() => UserEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity

  @Column({ type: 'varchar', length: 40 })
  identification: string

  @Column({ type: 'varchar', length: 120 })
  firstname: string

  @Column({ type: 'varchar', length: 120 })
  middlename: string

  @Column({ type: 'varchar', length: 120 })
  lastname: string

  @Column({ type: 'varchar', length: 120 })
  secondlastname: string

  @Column({ name: 'birth_date', type: 'date' })
  birthDate: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string | null

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer
  })
  latitude: number | null

  @Column({
    type: 'numeric',
    precision: 9,
    scale: 6,
    nullable: true,
    transformer: decimalTransformer
  })
  longitude: number | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date

  @OneToMany(() => PatientLocationHistory, history => history.patient)
  locationHistory: PatientLocationHistory[]
}
