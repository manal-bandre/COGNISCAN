import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SplashPage } from "./pages/SplashPage";
import { PatientAppLayout } from "./layouts/PatientAppLayout";
import { HomePage } from "./pages/patient/HomePage";
import { TasksPage } from "./pages/patient/TasksPage";
import { TaskRunnerPage } from "./pages/patient/TaskRunnerPage";
import { AnalysisPage } from "./pages/patient/AnalysisPage";
import { ReportsPage } from "./pages/patient/ReportsPage";
import { SettingsPage } from "./pages/patient/SettingsPage";
import { CareAppLayout } from "./layouts/CareAppLayout";
import { OverviewPage } from "./pages/care/OverviewPage";
import { AlertsPage } from "./pages/care/AlertsPage";
import { CareReportsPage } from "./pages/care/CareReportsPage";
import { MessageAIPage } from "./pages/care/MessageAIPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SplashPage />} />

        <Route path="/app" element={<PatientAppLayout />}>
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:taskKey" element={<TaskRunnerPage />} />
          <Route path="analysis" element={<AnalysisPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/care/app" element={<CareAppLayout />}>
          <Route index element={<Navigate to="/care/app/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="reports" element={<CareReportsPage />} />
          <Route path="message" element={<MessageAIPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
