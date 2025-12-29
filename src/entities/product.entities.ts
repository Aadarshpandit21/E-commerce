import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { AppCommon } from "./common.js";
import { Category } from "./categories.entities.js";
import { ProductImage } from "./product.images.entities.js";
import { ProductReview } from "./product.reviews.entities.js";

@Entity()
export class Products extends AppCommon {
  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price!: number;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column()
  stock!: number;

  @Column({ type: "decimal", precision: 2, scale: 1, default: 0 })
  rating!: number;

  @Column({ type: "int", default: 0 })
  reviewCount!: number;

  @Column({ type: "text", nullable: true })
  ingredients!: string;

  @Column({ type: "text", nullable: true })
  usage!: string;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Category, (category) => category.products, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "categoryId" })
  category!: Partial<Category>;

  @OneToMany(() => ProductImage, (image) => image.product)
  images!: ProductImage[];

  @OneToMany(() => ProductReview, (review) => review.product)
  reviews!: ProductReview[];
}
