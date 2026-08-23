import type { DeepPartial, Dictionary } from "../types";

/** Nepali translations. Missing keys resolve to English at lookup time. */
export const ne: DeepPartial<Dictionary> = {
  meta: {
    titleDefault: "Grooma",
    titleTemplate: "%s | Grooma",
    description: "तपाईंको ग्रुमिङ, सजिलो। सेकेन्डैमा नाइ खोप्नुहोस्।",
  },
  home: {
    tagline: "तपाईंको ग्रुमिङ, सजिलो।",
    placeholderNote: "ग्राहक चरणसँगै सार्वजनिक अनुभव आउँदैछ। प्रगतिका लागि डकुमेन्टेसन हेर्नुहोस्।",
    viewDesignSystem: "डिजाइन सिस्टम हेर्नुहोस्",
  },
  languageSwitcher: {
    label: "भाषा",
  },
  signIn: {
    title: "साइन इन",
    subtitle: "आफ्नो सप ड्यासबोर्डमा पहुँच राख्नुहोस्।",
    email: "इमेल",
    password: "पासवर्ड",
    submit: "साइन इन",
    submitting: "साइन इन भइरहेको...",
    invalidCredentials: "इमेल वा पासवर्ड गलत छ।",
    genericError: "केही गलत भयो। फेरि प्रयास गर्नुहोस्।",
    continueToDashboard: "ड्यासबोर्डमा जानुहोस्",
  },
  admin: {
    dashboardTitle: "ड्यासबोर्ड",
    shellNote: "अस्थायी खाका। पूर्ण एडमिन अनुभव पछिल्लो चरणमा आउँछ।",
    signedInAs: "साइन इन गरिएको",
    role: "भूमिका",
    appointmentsToday: "आजका अपोइन्टमेन्ट",
    signOut: "साइन आउट",
  },
};
