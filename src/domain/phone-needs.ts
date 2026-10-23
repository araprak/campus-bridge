export type CallingNeed = 'unsure' | 'occasional' | 'frequent' | 'international';
export type TextingNeed = 'unsure' | 'domestic' | 'international' | 'apps';
export type ContractPreference = 'unsure' | 'monthly' | 'prepay' | 'flexible';

export type PhoneComparisonNeeds = {
  calling: CallingNeed;
  texting: TextingNeed;
  contract: ContractPreference;
};

/** User-reported needs produce questions, never inferred plan eligibility or prices. */
export function phoneComparisonChecklist(needs: PhoneComparisonNeeds): string[] {
  const calling: Record<CallingNeed, string> = {
    unsure: 'Check your recent call minutes and whether you will call numbers outside the US.',
    occasional: 'Compare included call minutes and the charge if you exceed them.',
    frequent: 'Confirm the domestic calling allowance and any limits on unlimited calling.',
    international: 'Check the countries and mobile or landline numbers you call, included minutes and extra charges. Calling abroad and roaming abroad are different.',
  };
  const texting: Record<TextingNeed, string> = {
    unsure: 'Check whether you need ordinary SMS, picture messages or international texts in addition to messaging apps.',
    domestic: 'Confirm US SMS and picture-message allowances, including any extra charges.',
    international: 'Confirm texts to each destination country, supported numbers and any international SMS charges.',
    apps: 'Messaging apps need data or Wi-Fi. Confirm ordinary SMS separately for services that send verification texts.',
  };
  const contract: Record<ContractPreference, string> = {
    unsure: 'Compare the payment schedule, minimum term, renewal price and cancellation terms before choosing.',
    monthly: 'Look for month-to-month service with no long-term service commitment. Check separately for device-financing balances and promotional conditions.',
    prepay: 'Compare the full upfront payment, service period, refund rules and renewal total before prepaying several months.',
    flexible: 'Compare the full cost over your expected stay, minimum term and early cancellation charges. A lower advertised monthly price may require a longer commitment.',
  };
  return [calling[needs.calling], texting[needs.texting], contract[needs.contract]];
}
