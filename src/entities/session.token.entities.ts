import { Entity, Column, ManyToOne } from "typeorm";
import { Accounts } from "./accounts.entities.js";
import { AppCommon } from "./common.js";

@Entity()
export class SessionToken extends AppCommon {
  @Column({ type: "varchar", nullable: false })
  sessionToken!: string;

  @ManyToOne(() => Accounts, (account) => account, { nullable: false })
  account!: Partial<Accounts>;
}
