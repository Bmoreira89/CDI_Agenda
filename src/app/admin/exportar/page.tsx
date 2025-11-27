export { dynamic, revalidate, fetchCache } from "@/lib/routeConfig";
import ExportarClient from "./ExportarClient";

export default function Page() {
  return <ExportarClient />;
}
