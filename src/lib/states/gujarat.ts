import type { StateConfig } from "./types";

export const gujarat: StateConfig = {
  code: "GJ",
  name: "Gujarat",
  ruralAreaLabel: "Taluka",
  khataLabel: "Khata No.",
  districts: [
    "Ahmedabad",
    "Surat",
    "Vadodara",
    "Rajkot",
    "Bhavnagar",
    "Jamnagar",
    "Gandhinagar",
    "Anand",
    "Kutch",
    "Mehsana",
  ],
  talukasByDistrict: {
    Ahmedabad: ["Daskroi", "Sanand", "Dholka", "Viramgam", "Detroj-Rampura"],
    Surat: ["Choryasi", "Kamrej", "Olpad", "Bardoli", "Palsana"],
    Vadodara: ["Vadodara", "Padra", "Savli", "Karjan", "Waghodia"],
    Rajkot: ["Rajkot", "Lodhika", "Kotda Sangani", "Paddhari", "Jasdan"],
    Bhavnagar: ["Bhavnagar", "Sihor", "Talaja", "Mahuva", "Gariadhar"],
    Jamnagar: ["Jamnagar", "Jodiya", "Kalavad", "Lalpur", "Dhrol"],
    Gandhinagar: ["Gandhinagar", "Kalol", "Mansa", "Dehgam"],
    Anand: ["Anand", "Anklav", "Borsad", "Petlad", "Khambhat"],
    Kutch: ["Bhuj", "Anjar", "Gandhidham", "Mandvi", "Mundra"],
    Mehsana: ["Mehsana", "Kadi", "Visnagar", "Vijapur", "Unjha"],
  },
};

/** Registry keyed by state code, so the UI never hardcodes "Gujarat" directly. */
export const stateConfigs: Record<string, StateConfig> = {
  GJ: gujarat,
};

export const defaultStateCode = "GJ";
