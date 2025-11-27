export { dynamic, revalidate, fetchCache } from "@/lib/routeConfig";
import AdminSettingsClient from "./AdminSettingsClient";

export default function Page() {
  return <AdminSettingsClient />;
}
