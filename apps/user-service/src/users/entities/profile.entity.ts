import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true })
  phone!: string;

  @Column()
  role!: string;

  @Column({ nullable: true })
  address!: string;

  @Column({ nullable: true })
  avatar!: string;
}
