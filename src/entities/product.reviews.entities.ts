import { Entity, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { AppCommon } from "./common.js";
import { Products } from "./product.entities.js";
import { Accounts } from "./accounts.entities.js";

@Entity("product_reviews")
export class ProductReview extends AppCommon {
  @Column({ type: "int" })
  rating!: number;

  @Column({ type: "text", nullable: true })
  comment?: string;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Products, (product) => product, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product!: Partial<Products>;

  @ManyToOne(() => Accounts, (user) => user, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: Partial<Accounts>;
}
