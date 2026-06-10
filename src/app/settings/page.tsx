import { ModulePlaceholder } from "@/components/module-placeholder";
import { modulePlaceholders } from "@/lib/navigation";

export default function SettingsPage() {
  return <ModulePlaceholder {...modulePlaceholders.settings} />;
}
