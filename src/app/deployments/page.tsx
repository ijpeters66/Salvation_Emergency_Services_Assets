import { ModulePlaceholder } from "@/components/module-placeholder";
import { modulePlaceholders } from "@/lib/navigation";

export default function DeploymentsPage() {
  return <ModulePlaceholder {...modulePlaceholders.deployments} />;
}
