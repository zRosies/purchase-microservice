import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: string;

  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  orderId!: Order;

  @Column('uuid')
  productId!: string;

  @Column('int')
  quantity!: number;

  @Column()
  name!: string;

  @Column('decimal')
  unitPrice!: number;
}
