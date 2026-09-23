import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'discord_id', type: 'varchar', unique: true, nullable: true })
  discordId: string | null;

  @Column()
  username: string;

  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  /** Stored exclusively as a salted password hash; never selected by default. */
  @Column({ name: 'password_hash', type: 'varchar', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_super_admin', default: false })
  isSuperAdmin: boolean;

  @Column({ name: 'avatar_url', type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
