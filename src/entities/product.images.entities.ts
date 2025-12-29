import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { AppCommon } from "./common.js";
import { Products } from "./product.entities.js";

@Entity("product_images")
export class ProductImage extends AppCommon {
  @Column({ type: "varchar", length: 500 })
  imageUrl!: string;

  @Column({ default: false })
  isPrimary!: boolean;

  @ManyToOne(() => Products, (product) => product, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product!: Partial<Products>;
}
