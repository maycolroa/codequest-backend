import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Profile } from '../../auth/entities/profile.entity';

@Entity('user_assessments')
export class UserAssessment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'profile_id', type: 'uuid' }) profileId: string;
  @ManyToOne(() => Profile, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'profile_id' }) profile: Profile;
  @Column('text', { array: true }) interests: string[];
  @Column({ type: 'text' }) goals: string;
  @Column({ name: 'current_level', type: 'varchar' }) currentLevel: string;
  @Column({ name: 'available_hours_per_week', type: 'integer' }) availableHoursPerWeek: number;
  @Column('text', { name: 'preferred_technologies', array: true, default: () => "'{}'" }) preferredTechnologies: string[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
