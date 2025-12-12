import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { AppCommon } from "./common.js";

import { UserStatus, Role } from "../utils/enum.js";
import { SessionToken } from "./session.token.entities.js";

@Entity()
export class Accounts extends AppCommon {
  @Column({ type: "varchar", default: null })
  name!: string;

  @Column({ type: "enum", enum: Role, default: Role.USER })
  role!: Role;

  @Column({ unique: true, type: "varchar", default: null })
  email!: string;

  @Column({ unique: true, type: "varchar", default: null })
  mobile!: string;

  @Column({ type: "varchar", default: null })
  password!: string;

  @Column({ type: "enum", enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "boolean", default: false })
  isDetailVerfied!: boolean;

  @Column({ type: "boolean", default: false })
  isMobileVerified!: boolean;

  @Column({ type: "boolean", default: false })
  isEmailVerified!: boolean;

  @OneToMany(() => SessionToken, (token) => token.account, {
    cascade: true,
  })
  sessionToken!: SessionToken[];
}
