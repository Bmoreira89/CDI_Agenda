export { dynamic, revalidate, fetchCache } from "@/lib/routeConfig";
import AdminCidadesClient from "./AdminCidadesClient";

export default function Page() {
  return <AdminCidadesClient />;
}
