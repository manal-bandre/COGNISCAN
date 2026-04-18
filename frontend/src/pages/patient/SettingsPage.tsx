import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Link } from "react-router-dom";

// Local stub profile — no backend needed
const LOCAL_PROFILE = {
  name: "Demo User",
  age: 65,
  language: "English",
  education: "Graduate",
};

export function SettingsPage() {
  const sections = [
    {
      title: "Profile",
      items: [
        ["Name", LOCAL_PROFILE.name],
        ["Age", String(LOCAL_PROFILE.age)],
        ["Language", LOCAL_PROFILE.language],
        ["Education", LOCAL_PROFILE.education],
      ],
    },
    {
      title: "Notifications",
      items: [
        ["SMS alerts", "On"],
        ["WhatsApp alerts", "On"],
        ["Email reports", "Weekly"],
        ["Voice reminders", "On"],
      ],
    },
    {
      title: "Privacy",
      items: [
        ["Data encryption", "Enabled"],
        ["Share with doctor", "With consent"],
        ["Share with caretaker", "Enabled"],
        ["Data storage", "Local device"],
      ],
    },
    {
      title: "Subscription",
      items: [
        ["Plan", "Free"],
        ["Tasks/day", "3"],
        ["AI insights", "Basic"],
      ],
    },
  ] as const;

  function handleClearData() {
    if (confirm("Are you sure? This will erase all your saved task results from this device.")) {
      localStorage.removeItem("cog_results");
      alert("Data cleared. Your progress has been reset.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Settings</h2>
        <p className="text-sm text-slate-500">Manage your profile and preferences.</p>
      </div>

      {sections.map((s) => (
        <Card key={s.title}>
          <div className="text-sm font-semibold text-slate-900">{s.title}</div>
          <div className="mt-3 divide-y divide-slate-100">
            {s.items.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2 text-sm">
                <div className="text-slate-500">{k}</div>
                <div className="font-medium text-slate-900">{v}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card className="border-red-100 bg-red-50">
        <div className="text-sm font-semibold text-red-800">Danger zone</div>
        <p className="mt-1 text-xs text-red-600">This will permanently erase all saved task results on this device.</p>
        <button
          onClick={handleClearData}
          className="mt-3 rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          Clear all session data
        </button>
      </Card>

      <Link to="/app/tasks">
        <Button variant="primary" className="w-full">Upgrade to Premium ✨</Button>
      </Link>
    </div>
  );
}
