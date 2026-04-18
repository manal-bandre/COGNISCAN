export type UserRole = "patient" | "caretaker";

export type PatientProfile = {
  age: number;
  gender: string;
  language: string;
  education: string;
};

export type SessionUser =
  | {
      id: string;
      role: "patient";
      name: string;
      phone?: string;
      patientProfile?: PatientProfile;
    }
  | {
      id: string;
      role: "caretaker";
      name: string;
      phone?: string;
      email?: string;
    };

