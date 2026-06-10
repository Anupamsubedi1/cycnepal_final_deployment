"use client";

import { useState, useEffect } from "react";
import NepaliDate from "nepali-date-converter";
import { UserRound, Languages, Users, CalendarDays, IdCard, Star } from "lucide-react";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import DatePicker from "@/components/ui/DatePicker";
import SearchableSelect from "./SearchableSelect";
import { allDistricts } from "@/lib/provinces-districts";
import {
  Section,
  StepHeader,
  TextField,
  SelectField,
  FieldLabel,
  FieldError,
  inputClass,
} from "./FormKit";

interface BasicDetailsStepProps {
  formData: any;
  onUpdate: (section: string, data: any) => void;
  vacancyId: string;
  validationTrigger?: number;
}

export default function BasicDetailsStep({
  formData,
  onUpdate,
  validationTrigger,
}: BasicDetailsStepProps) {
  const { t } = useVacancyLanguage();
  const [localData, setLocalData] = useState(formData.personalDetails || {});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // allow Devanagari letters, spaces, danda (।), double danda (॥) and hyphen
  const devanagariRegex = /^[ऀ-ॿ\s।॥\-]+$/;
  // English name: letters, spaces and hyphen only (no apostrophe or specials)
  const englishNameRegex = /^[A-Za-z\s\-]+$/;
  // Citizenship number may include digits and hyphens.
  const citizenshipRegex = /^(?=.*\d)[0-9-]+$/;

  const optionalText = t("vacancy.optional");

  const validatePersonalDetails = (data: Record<string, any>) => {
    const nextErrors: Record<string, string> = {};
    const maritalStatus = String(data.maritalStatus || "");

    const validateEnglishName = (name: string, required: boolean) => {
      const value = String(data[name] || "").trim();
      if (!value) {
        if (required) nextErrors[name] = t("vacancy.required");
        return;
      }
      if (!englishNameRegex.test(value)) nextErrors[name] = "Please enter letters only (A–Z).";
    };

    const validateRequiredText = (name: string, message = t("vacancy.required")) => {
      const value = String(data[name] || "").trim();
      if (!value) nextErrors[name] = message;
    };

    const validateNepaliName = (name: string, required: boolean) => {
      const value = String(data[name] || "").trim();
      if (!value) {
        if (required) nextErrors[name] = t("vacancy.required");
        return;
      }
      if (!devanagariRegex.test(value)) nextErrors[name] = "कृपया केवल नेपाली (देवनागरी) अक्षर मात्र प्रविष्ट गर्नुहोस्।";
    };

    validateEnglishName("firstName", true);
    validateEnglishName("middleName", false);
    validateEnglishName("lastName", true);

    validateRequiredText("firstNameNepali");
    validateRequiredText("lastNameNepali");
    if (data.firstNameNepali && !devanagariRegex.test(String(data.firstNameNepali).trim())) nextErrors.firstNameNepali = "कृपया केवल नेपाली (देवनागरी) अक्षर मात्र प्रविष्ट गर्नुहोस्।";
    if (data.lastNameNepali && !devanagariRegex.test(String(data.lastNameNepali).trim())) nextErrors.lastNameNepali = "कृपया केवल नेपाली (देवनागरी) अक्षर मात्र प्रविष्ट गर्नुहोस्।";
    if (data.middleNameNepali && !devanagariRegex.test(String(data.middleNameNepali).trim())) nextErrors.middleNameNepali = "कृपया केवल नेपाली (देवनागरी) अक्षर मात्र प्रविष्ट गर्नुहोस्।";

    validateEnglishName("fatherFirstName", true);
    validateEnglishName("fatherMiddleName", false);
    validateEnglishName("fatherLastName", true);

    validateEnglishName("motherFirstName", true);
    validateEnglishName("motherMiddleName", false);
    validateEnglishName("motherLastName", true);

    validateEnglishName("grandfatherFirstName", true);
    validateEnglishName("grandfatherMiddleName", false);
    validateEnglishName("grandfatherLastName", true);

    // Family details in Nepali (Devanagari)
    validateNepaliName("fatherFirstNameNepali", true);
    validateNepaliName("fatherMiddleNameNepali", false);
    validateNepaliName("fatherLastNameNepali", true);
    validateNepaliName("motherFirstNameNepali", true);
    validateNepaliName("motherMiddleNameNepali", false);
    validateNepaliName("motherLastNameNepali", true);
    validateNepaliName("grandfatherFirstNameNepali", true);
    validateNepaliName("grandfatherMiddleNameNepali", false);
    validateNepaliName("grandfatherLastNameNepali", true);

    validateRequiredText("maritalStatus");
    if (maritalStatus && !["single", "married", "divorced"].includes(maritalStatus)) {
      nextErrors.maritalStatus = "Please select a valid marital status.";
    }

    if (maritalStatus === "married") {
      validateEnglishName("spouseFirstName", true);
      validateEnglishName("spouseMiddleName", false);
      validateEnglishName("spouseLastName", true);
      validateNepaliName("spouseFirstNameNepali", true);
      validateNepaliName("spouseMiddleNameNepali", false);
      validateNepaliName("spouseLastNameNepali", true);
    }

    validateRequiredText("dobBS");
    validateRequiredText("dobAD");
    validateRequiredText("gender");
    validateRequiredText("citizenshipNumber");
    validateRequiredText("issuedDistrict");
    validateRequiredText("issuedDate");

    if (String(data.citizenshipNumber || "").trim() && !citizenshipRegex.test(String(data.citizenshipNumber).trim())) {
      nextErrors.citizenshipNumber = "Please enter digits and dashes only.";
    }

    if (String(data.issuedDistrict || "").trim()) {
      const normalizedValue = String(data.issuedDistrict).trim().toLowerCase();
      const validDistrict = allDistricts.some((district) => district.name.toLowerCase() === normalizedValue);
      if (!validDistrict) nextErrors.issuedDistrict = "Please select a district from the list.";
    }

    return nextErrors;
  };

  useEffect(() => {
    setLocalData(formData.personalDetails || {});
  }, [formData.personalDetails]);

  // Derive errors from the latest local data on every render so ticks and
  // messages stay in sync without an extra effect. We only *surface* them for
  // fields the user has interacted with (see `attempted`/`touched`).
  const errors = validatePersonalDetails(localData);

  // When the user tries to advance, validationTrigger increments (> 0). It stays
  // 0 on first mount, so nothing is shown before the user has typed.
  const attempted = typeof validationTrigger === "number" && validationTrigger > 0;

  const isRevealed = (name: string) => attempted || !!touched[name];
  const fieldError = (name: string) => (isRevealed(name) ? errors[name] : undefined);
  const fieldValid = (name: string) =>
    isRevealed(name) && !errors[name] && String(localData[name] || "").trim().length > 0;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name } = e.target;
    if (name) setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const fieldValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    const updated = { ...localData, [name]: fieldValue };

    if (name === "maritalStatus" && value !== "married") {
      delete updated.spouseFirstName;
      delete updated.spouseMiddleName;
      delete updated.spouseLastName;
      delete updated.spouseFirstNameNepali;
      delete updated.spouseMiddleNameNepali;
      delete updated.spouseLastNameNepali;
    }

    // If AD date changed, convert to BS and populate dobBS
    if (name === "dobAD") {
      try {
        const parsed = new Date(String(fieldValue));
        if (!Number.isNaN(parsed.getTime())) {
          const bs = NepaliDate.fromAD(parsed).format("YYYY-MM-DD");
          updated.dobBS = bs;
        }
      } catch (err) {
        // ignore conversion errors
      }
    }

    // If BS date changed, convert to AD and populate dobAD
    if (name === "dobBS") {
      try {
        const bsStr = String(fieldValue).trim();
        if (bsStr) {
          const nd = new NepaliDate(bsStr);
          const adDate = nd.toJsDate();
          const yyyy = adDate.getFullYear();
          const mm = String(adDate.getMonth() + 1).padStart(2, "0");
          const dd = String(adDate.getDate()).padStart(2, "0");
          updated.dobAD = `${yyyy}-${mm}-${dd}`;
        }
      } catch (err) {
        // ignore conversion errors
      }
    }

    // Picker/select-driven fields should reveal immediately on change.
    setTouched((prev) => ({ ...prev, [name]: true }));
    setLocalData(updated);
    onUpdate("personalDetails", updated);
  };

  // Shared prop builder for the reusable TextField
  const textProps = (name: string, label: string, opts: { required?: boolean; optional?: boolean; placeholder?: string; hint?: string } = {}) => ({
    label,
    name,
    value: localData[name] || "",
    onChange: handleChange,
    onBlur: handleBlur,
    placeholder: opts.placeholder ?? label,
    required: opts.required,
    optional: opts.optional,
    optionalText,
    error: fieldError(name),
    valid: fieldValid(name),
    hint: opts.hint,
  });

  // Plain render helper (NOT a component) so inputs keep focus across renders.
  // Pass `hint` to surface a short suggestion under the first field (used for
  // the Nepali/Devanagari name rows).
  const renderNames = (first: string, middle: string, last: string, hint?: string) => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <TextField {...textProps(first, t("vacancy.firstName"), { required: true, hint })} />
      <TextField {...textProps(middle, t("vacancy.middleName"), { optional: true })} />
      <TextField {...textProps(last, t("vacancy.lastName"), { required: true })} />
    </div>
  );

  return (
    <div className="space-y-5">
      <StepHeader
        stepLabel={`${t("vacancy.step")} 1`}
        title={t("vacancy.personalDetail")}
        subtitle={t("vacancy.personalIntro")}
      />

      <Section icon={UserRound} accent="teal" title={t("vacancy.nameEnglish")}>
        {renderNames("firstName", "middleName", "lastName")}
      </Section>

      <Section icon={Languages} accent="indigo" title={t("vacancy.nameNepali")} subtitle={t("vacancy.devanagariHint")}>
        {renderNames("firstNameNepali", "middleNameNepali", "lastNameNepali", t("vacancy.devanagariHint"))}
      </Section>

      <Section icon={Users} accent="amber" title={t("vacancy.familyDetails")} subtitle={t("vacancy.familyDetailsHint")}>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{t("vacancy.fatherName")}</h4>
            {renderNames("fatherFirstName", "fatherMiddleName", "fatherLastName")}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{t("vacancy.motherName")}</h4>
            {renderNames("motherFirstName", "motherMiddleName", "motherLastName")}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{t("vacancy.grandfatherName")}</h4>
            {renderNames("grandfatherFirstName", "grandfatherMiddleName", "grandfatherLastName")}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <SelectField
              label={t("vacancy.maritalStatus")}
              name="maritalStatus"
              value={localData.maritalStatus || ""}
              onChange={handleChange}
              onBlur={handleBlur}
              required
              error={fieldError("maritalStatus")}
              valid={fieldValid("maritalStatus")}
            >
              <option value="">{t("vacancy.selectOption")}</option>
              <option value="single">{t("vacancy.single")}</option>
              <option value="married">{t("vacancy.married")}</option>
              <option value="divorced">{t("vacancy.divorced")}</option>
            </SelectField>
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4">
              <p className="text-sm font-semibold text-amber-900">{t("vacancy.spouseHintTitle")}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{t("vacancy.spouseHint")}</p>
            </div>
          </div>

          {localData.maritalStatus === "married" && (
            <div className="rounded-xl border border-slate-100 bg-[linear-gradient(180deg,#f8fbfc_0%,#ffffff_100%)] p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{t("vacancy.spouseTitle")}</h4>
              {renderNames("spouseFirstName", "spouseMiddleName", "spouseLastName")}
            </div>
          )}
        </div>
      </Section>

      <Section icon={Languages} accent="indigo" title={t("vacancy.familyDetailsNepali")} subtitle={t("vacancy.devanagariHint")}>
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{t("vacancy.fatherNameNepali")}</h4>
            {renderNames("fatherFirstNameNepali", "fatherMiddleNameNepali", "fatherLastNameNepali", t("vacancy.devanagariHint"))}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{t("vacancy.motherNameNepali")}</h4>
            {renderNames("motherFirstNameNepali", "motherMiddleNameNepali", "motherLastNameNepali")}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{t("vacancy.grandfatherNameNepali")}</h4>
            {renderNames("grandfatherFirstNameNepali", "grandfatherMiddleNameNepali", "grandfatherLastNameNepali")}
          </div>
          {localData.maritalStatus === "married" && (
            <div className="rounded-xl border border-slate-100 bg-[linear-gradient(180deg,#f8fbfc_0%,#ffffff_100%)] p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">{t("vacancy.spouseTitleNepali")}</h4>
              {renderNames("spouseFirstNameNepali", "spouseMiddleNameNepali", "spouseLastNameNepali")}
            </div>
          )}
        </div>
      </Section>

      <Section icon={CalendarDays} accent="sky" title={t("vacancy.dobTitle")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <FieldLabel label={t("vacancy.inBS")} required />
            <DatePicker
              calendar="bs"
              value={localData.dobBS || undefined}
              onChange={(iso) => handleChange({ target: { name: "dobBS", value: iso } } as unknown as React.ChangeEvent<HTMLInputElement>)}
              placeholder="YYYY-MM-DD"
              className={inputClass(fieldError("dobBS"), fieldValid("dobBS"))}
            />
            <FieldError error={fieldError("dobBS")} />
          </div>
          <div>
            <FieldLabel label={t("vacancy.inAD")} required />
            <DatePicker
              id="dobAD"
              value={localData.dobAD || undefined}
              onChange={(iso) => handleChange({ target: { name: "dobAD", value: iso } } as unknown as React.ChangeEvent<HTMLInputElement>)}
              placeholder="Select AD date"
              className={inputClass(fieldError("dobAD"), fieldValid("dobAD"))}
            />
            <FieldError error={fieldError("dobAD")} />
          </div>
          <SelectField
            label={t("vacancy.gender")}
            name="gender"
            value={localData.gender || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            required
            error={fieldError("gender")}
            valid={fieldValid("gender")}
          >
            <option value="">{t("vacancy.selectOption")}</option>
            <option value="male">{t("vacancy.male")}</option>
            <option value="female">{t("vacancy.female")}</option>
            <option value="other">{t("vacancy.other")}</option>
          </SelectField>
        </div>
      </Section>

      <Section icon={IdCard} accent="emerald" title={t("vacancy.citizenshipTitle")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField
            {...textProps("citizenshipNumber", t("vacancy.citizenshipNumber"), { required: true })}
            inputMode="numeric"
            pattern="(?=.*\\d)[0-9-]+"
            title="Please enter digits and dashes only."
          />
          <SearchableSelect
            name="issuedDistrict"
            value={localData.issuedDistrict || ""}
            onChange={handleChange}
            options={allDistricts.map((district) => district.name)}
            label={t("vacancy.citizenshipDistrict")}
            placeholder="Search district"
            error={fieldError("issuedDistrict")}
            valid={fieldValid("issuedDistrict")}
            required
          />
          <div>
            <FieldLabel label={t("vacancy.issuedDateBS")} required />
            <DatePicker
              value={localData.issuedDate || undefined}
              calendar="bs"
              onChange={(iso) => handleChange({ target: { name: "issuedDate", value: iso } } as unknown as React.ChangeEvent<HTMLInputElement>)}
              placeholder="Select BS date"
              className={inputClass(fieldError("issuedDate"), fieldValid("issuedDate"))}
            />
            <FieldError error={fieldError("issuedDate")} />
          </div>
        </div>
      </Section>

      <Section icon={Star} accent="violet" title={t("vacancy.additionalPreferencesTitle")}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { name: "motorcycleLicense", label: t("vacancy.pref.motorcycleLicense") },
            { name: "computerKnowledge", label: t("vacancy.pref.computerKnowledge") },
            { name: "microfinanceExperience", label: t("vacancy.pref.microfinanceExperience") },
            { name: "isFromPriorityProvince", label: t("vacancy.priorityProvince") },
          ].map((pref) => (
            <label
              key={pref.name}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm transition hover:border-violet-300 hover:bg-violet-50/40"
            >
              <input
                type="checkbox"
                name={pref.name}
                checked={!!localData[pref.name]}
                onChange={handleChange}
                className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-slate-700">{pref.label}</span>
            </label>
          ))}
        </div>
      </Section>
    </div>
  );
}
