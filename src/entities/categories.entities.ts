import { Entity, Column, OneToMany } from "typeorm";
import { AppCommon } from "./common.js";
import { Products } from "./product.entities.js";

@Entity()
export class Category extends AppCommon {
  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  slug!: string;

  @Column({ type: "text", nullable: true })
  description!: string;

  @Column({ type: "text", nullable: true })
  images!: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => Products, (product) => product.category)
  products!: Products[];
}
