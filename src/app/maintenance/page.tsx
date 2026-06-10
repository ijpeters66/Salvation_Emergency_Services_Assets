import { ModulePlaceholder } from "@/components/module-placeholder";
import { modulePlaceholders } from "@/lib/navigation";

export default function MaintenancePage() {
  return <ModulePlaceholder {...modulePlaceholders.maintenance} />;
}
