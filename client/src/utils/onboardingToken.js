// Utility functions to manage onboarding token
export const setOnboardingComplete = () => {
  localStorage.setItem('onboardingComplete', 'true');
};

export const isOnboardingComplete = () => {
  return localStorage.getItem('onboardingComplete') === 'true';
};

export const resetOnboarding = () => {
  localStorage.removeItem('onboardingComplete');
};
