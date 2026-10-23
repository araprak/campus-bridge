/** Use calendar dates supplied by the form and Dallas clock, not the browser timezone. */
export function onboardingCopy(arrivalDate: string, todayDallas: string) {
  const arrival = new Date(`${arrivalDate}T00:00:00Z`);
  const future = arrivalDate > todayDallas;
  const today = arrivalDate === todayDallas;
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  }).format(arrival);
  return {
    priorities: 'What would you like to get ready first?',
    prioritiesDescription: 'Select any topics you want to focus on. Leave this blank for a guided starting order.',
    homeTitle: future ? 'Let’s plan your home in Dallas.' : 'Tell us about your home.',
    homeDescription: future
      ? `For your arrival on ${dateLabel}, tell us what you’re planning so far.`
      : today ? 'Arriving today? Tell us about your home so we can help you settle in.'
        : 'Tell us about your current home so we can guide your next steps.',
    location: future ? 'Where do you plan to live?' : 'Where are you living?',
    housingType: future ? 'What type of home are you planning for?' : 'What type of home are you living in?',
    household: future ? 'Who do you expect to live with?' : 'Who are you living with?',
    alone: future ? 'I’ll live alone' : 'I live alone',
    transportDescription: future
      ? 'Let’s plan how you’ll get around after you arrive.'
      : 'Let’s make sure your plan fits how you get around.',
    transport: future ? 'How do you plan to get around?' : 'How do you get around?',
    transitMode: future ? 'Which option do you expect to use?' : 'Which option do you use?',
    car: future ? 'Will you have a car available to drive?' : 'Do you have a car available to drive?',
  };
}
