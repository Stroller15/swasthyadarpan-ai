export type SampleReport = {
  id: "cbc" | "lipid" | "thyroid";
  label: string;
  description: string;
  path: string;
};

export const SAMPLES: SampleReport[] = [
  { id: "cbc", label: "Blood count (CBC)", description: "Low hemoglobin", path: "/samples/cbc.pdf" },
  { id: "lipid", label: "Cholesterol panel", description: "High LDL cholesterol", path: "/samples/lipid.pdf" },
  { id: "thyroid", label: "Thyroid panel", description: "All values normal", path: "/samples/thyroid.pdf" },
];
