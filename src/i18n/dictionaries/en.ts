/** Base dictionary. Every other locale falls back to these values per key. */
export const en = {
  meta: {
    titleDefault: "Grooma",
    titleTemplate: "%s | Grooma",
    description: "Your grooming, made simple. Book barber appointments in seconds.",
  },
  home: {
    tagline: "Your grooming, made simple.",
    placeholderNote:
      "Public experience arrives with the customer phase. See docs and tracker for progress.",
    viewDesignSystem: "View design system",
  },
  languageSwitcher: {
    label: "Language",
    en: "English",
    ne: "नेपाली",
  },
  signIn: {
    title: "Sign in",
    subtitle: "Access your shop dashboard.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    submitting: "Signing in...",
    invalidCredentials: "Invalid email or password.",
    genericError: "Something went wrong. Please try again.",
    continueToDashboard: "Continue to dashboard",
  },
  admin: {
    dashboardTitle: "Dashboard",
    shellNote: "Placeholder shell. Full admin experience lands in a later phase.",
    signedInAs: "Signed in as",
    role: "Role",
    appointmentsToday: "Appointments today",
    signOut: "Sign out",
  },
  notFound: {
    title: "This page isn't on the menu.",
    subtitle:
      "It must have left with the clippings. The shop, however, is right where you left it.",
    action: "Back to the chair",
  },
  errorPage: {
    title: "Snagged the wire.",
    subtitle:
      "One of our clippers tripped a fuse mid-cut. Give it another go; no charge for the pause.",
    retry: "Try again",
  },
};

export type Dictionary = typeof en;
