export const devanagariRegex = /^[\u0900-\u097F\s\u0964\u0965\-]+$/;
// English names: letters, spaces and hyphens only — no apostrophes or other
// special characters (e.g. "Ram Bahadur" or "Ram-Bahadur", but not "Ram's").
// Must contain at least one letter (rejects "-" / "  ").
export const englishNameRegex = /^(?=.*[A-Za-z])[A-Za-z\s\-]+$/;
export const alphaRegex = /^(?=.*[A-Za-z])[A-Za-z\s\-]+$/;
export const numericRegex = /^[0-9]+$/;
export const citizenshipRegex = /^(?=.*\d)[0-9-]+$/;
export const englishAddressRegex = /^[A-Za-z0-9\s\-\/().,]+$/;
export const nepaliAddressRegex = /^[\u0900-\u097F\u0966-\u096F0-9\s\-\/().,']+$/;
// Allow digits, +, spaces, hyphen — but must contain at least one digit
// (rejects "+" / "-" alone).
export const phoneRegex = /^(?=.*[0-9])[0-9\+\s\-]+$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(name: string, value: any): string | null {
  const v = typeof value === 'string' ? value.trim() : value;
  if (name === 'reference1Name' || name === 'reference2Name') {
    if (!v) return null;
    if (!englishNameRegex.test(String(v))) return 'Please enter letters only.';
    return null;
  }

  if (name === 'reference1Phone' || name === 'reference2Phone') {
    if (!v) return null;
    if (!phoneRegex.test(String(v))) return 'Please enter a valid phone number.';
    return null;
  }

  if (name === 'tempPhoneNepali') {
    if (!v) return 'This field is required.';
    if (!phoneRegex.test(String(v))) return 'Please enter a valid phone number.';
    return null;
  }

  if (name === 'firstName' || name === 'lastName') {
    if (!v) return 'This field is required.';
    if (!englishNameRegex.test(String(v))) return 'Please enter letters only.';
    return null;
  }

  if (
    name === 'permStateNepali' ||
    name === 'permDistrictNepali' ||
    name === 'permLocalLevelTypeNepali' ||
    name === 'tempStateNepali' ||
    name === 'tempDistrictNepali' ||
    name === 'tempLocalLevelTypeNepali'
  ) {
    if (!v) return 'This field is required.';
    return null;
  }

  if (name === 'permWard' || name === 'tempWard') {
    if (!v) return 'This field is required.';
    if (!numericRegex.test(String(v))) return 'Please enter digits only.';
    return null;
  }

  if (name === 'permWardNepali' || name === 'tempWardNepali') {
    if (!v) return 'This field is required.';
    if (!/^[0-9\u0966-\u096F]+$/.test(String(v))) return 'कृपया केवल अंक मात्र प्रविष्ट गर्नुहोस्।';
    return null;
  }

  if (name.endsWith('Nepali')) {
    if (name === 'permStreetNameNepali' || name === 'permHouseNoNepali' || name === 'tempStreetNameNepali' || name === 'tempHouseNoNepali') {
      if (!v) return null;
      if (!nepaliAddressRegex.test(String(v))) return 'कृपया नेपाली अक्षर र अंक मात्र प्रविष्ट गर्नुहोस्।';
      return null;
    }
    if (!v) return 'Required.';
    if (!devanagariRegex.test(String(v))) return 'कृपया केवल नेपाली (देवनागरी) अक्षर मात्र प्रविष्ट गर्नुहोस्।';
    return null;
  }

  if (name === 'permPhone') {
    if (!v) return null;
    if (!phoneRegex.test(String(v))) return 'Please enter a valid phone number.';
    return null;
  }

  if (name === 'tempPhone' || name === 'mobile' || name.includes('Phone')) {
    if (!v) return 'This field is required.';
    if (!phoneRegex.test(String(v))) return 'Please enter a valid phone number (digits only).';
    return null;
  }

  if (name === 'email') {
    if (!v) return 'This field is required.';
    if (!emailRegex.test(String(v))) return 'Please enter a valid email address.';
    return null;
  }

  if (name === 'citizenshipNumber') {
    if (!v) return 'This field is required.';
    if (name === 'citizenshipNumber' && !citizenshipRegex.test(String(v))) return 'Please enter digits and dashes only.';
    return null;
  }

  if (
    name === 'permStreetName' ||
    name === 'permHouseNo' ||
    name === 'tempStreetName' ||
    name === 'tempHouseNo'
  ) {
    if (!v) return null;
    if (!englishAddressRegex.test(String(v))) return 'Please use letters, numbers, spaces, and common separators only.';
    return null;
  }

  // Generic required check for fields with * in name mapping
  const requiredFields = new Set([
    'permMunicipality', 'permDistrict', 'permState', 'permLocalLevelType', 'permTole', 'permWard',
    'permMunicipalityNepali', 'permDistrictNepali', 'permStateNepali', 'permLocalLevelTypeNepali', 'permToleNepali', 'permWardNepali',
    'tempMunicipality', 'tempDistrict', 'tempState', 'tempLocalLevelType', 'tempTole', 'tempWard',
    'tempMunicipalityNepali', 'tempDistrictNepali', 'tempStateNepali', 'tempLocalLevelTypeNepali', 'tempToleNepali', 'tempWardNepali', 'tempPhoneNepali'
  ]);
  if (requiredFields.has(name)) {
    if (!v) return 'This field is required.';
    return null;
  }

  return null;
}
