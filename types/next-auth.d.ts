import type { RoleName } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    roles?: RoleName[];
  }

  interface Session {
    user: {
      id: string;
      roles: RoleName[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    roles?: RoleName[];
  }
}
