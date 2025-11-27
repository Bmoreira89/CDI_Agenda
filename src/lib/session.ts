import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function getSessionServer() {
  return getServerSession(authOptions);
}

export async function getUserEmailServer() {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}
