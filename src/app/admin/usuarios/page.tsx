export { dynamic, revalidate, fetchCache } from "@/lib/routeConfig";
import AdminUsuariosClient from "./AdminUsuariosClient";

export default function Page() {
  return <AdminUsuariosClient />;
}
