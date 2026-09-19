import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column()
  level: string;

  @Column()
  url: string;

  @Column({ name: 'duration_hours', type: 'integer' })
  durationHours: number;

  @Column('text', { array: true, default: () => "'{}'" })
  tags: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}