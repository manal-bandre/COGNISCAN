import { useOutletContext } from "react-router-dom";

export function useCarePatientId() {
  return useOutletContext<{ patientId: string | null }>().patientId;
}

