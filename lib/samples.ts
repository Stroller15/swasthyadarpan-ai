export type SampleReport = {
  id: "cbc" | "lipid" | "thyroid";
  label: string;
  description: string;
  path: string;
  /** What the sample shows, for the status dot next to its description. */
  tone: "low" | "high" | "normal";
};

export const SAMPLES: SampleReport[] = [
  { id: "cbc", label: "Blood count (CBC)", description: "Low hemoglobin", path: "/samples/cbc.pdf", tone: "low" },
  { id: "lipid", label: "Cholesterol panel", description: "High LDL cholesterol", path: "/samples/lipid.pdf", tone: "high" },
  { id: "thyroid", label: "Thyroid panel", description: "All values normal", path: "/samples/thyroid.pdf", tone: "normal" },
];
