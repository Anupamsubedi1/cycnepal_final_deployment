"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, Navigation, Phone, Users } from "lucide-react";
import { validateField } from "@/lib/validation";
import { useVacancyLanguage } from "@/components/vacancy/VacancyLanguageContext";
import { allDistricts, getDistrictsByProvince, provincesDistricts } from "@/lib/provinces-districts";
import SearchableSelect from "./SearchableSelect";
import { Section, StepHeader, TextField, SelectField } from "./FormKit";

interface ContactDetailsStepProps {
  formData: any;
  onUpdate: (section: string, data: any) => void;
  vacancyId: string;
  validationTrigger?: number;
}

const localLevelTypes = [
  { value: "vdc", label: "Rural Municipality" },
  { value: "municipality", label: "Municipality" },
  { value: "sub_metropolitan_city", label: "Sub-Metropolitan City" },
  { value: "metropolitan_city", label: "Metropolitan City" },
];

export default function ContactDetailsStep({
  formData,
  onUpdate,
  validationTrigger,
}: ContactDetailsStepProps) {
  const { t } = useVacancyLanguage();
  const [localData, setLocalData] = useState(formData.contactDetails || {});
  const [sameAsPermenant, setSameAsPermenant] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const permDistrictOptions = useMemo(
    () => (localData.permState ? getDistrictsByProvince(localData.permState) : []),
    [localData.permState],
  );
  const tempDistrictOptions = useMemo(
    () => (localData.tempState ? getDistrictsByProvince(localData.tempState) : []),
    [localData.tempState],
  );

  const validateDistrictValue = (value: string, stateId?: string) => {
    if (!value.trim()) return "This field is required.";
    const allowed = stateId ? getDistrictsByProvince(stateId) : allDistricts.map((d) => d.name);
    if (!allowed.includes(value.trim())) return "Please select a district from the list.";
    return null;
  };

  useEffect(() => {
    setLocalData(formData.contactDetails || {});
  }, [formData.contactDetails]);

  // Every field validateField() knows about — this restores per-field format
  // checks (Devanagari for *Nepali fields, numeric wards, email/phone, etc.) on
  // top of the required checks.
  const allValidatedFields = [
    "permState", "permDistrict", "permLocalLevelType", "permMunicipality", "permWard", "permTole", "permStreetName", "permHouseNo",
    "tempState", "tempDistrict", "tempLocalLevelType", "tempMunicipality", "tempWard", "tempTole", "tempStreetName", "tempHouseNo",
    "mobile", "email", "reference1Name", "reference1Phone", "reference2Name", "reference2Phone",
  ];

  const validateContactDetails = (data: any) => {
    const nextErrors: Record<string, string> = {};
    for (const field of allValidatedFields) {
      const err = validateField(field, (data || {})[field] ?? "");
      if (err) nextErrors[field] = err;
    }
    // District value must belong to the chosen province.
    if (String(data?.permDistrict || "").trim()) {
      const err = validateDistrictValue(String(data.permDistrict), data.permState);
      if (err) nextErrors.permDistrict = err;
    }
    if (String(data?.tempDistrict || "").trim()) {
      const err = validateDistrictValue(String(data.tempDistrict), data.tempState);
      if (err) nextErrors.tempDistrict = err;
    }
    return nextErrors;
  };

  // Errors are derived each render; surfaced only for interacted fields.
  const errors = validateContactDetails(localData);
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
    const { name, value } = e.target;
    const updated = { ...localData, [name]: value };
    if (name === "permState") {
      updated.permDistrict = "";
      updated.permDistrictNepali = "";
    }
    if (name === "tempState") {
      updated.tempDistrict = "";
      updated.tempDistrictNepali = "";
    }
    setTouched((prev) => ({ ...prev, [name]: true }));
    setLocalData(updated);
    onUpdate("contactDetails", updated);
  };

  const mirrorPermToTemp = (d: any) => ({
    tempState: d.permState ?? "",
    tempDistrict: d.permDistrict ?? "",
    tempLocalLevelType: d.permLocalLevelType ?? "",
    tempMunicipality: d.permMunicipality ?? "",
    tempWard: d.permWard ?? "",
    tempTole: d.permTole ?? "",
    tempStreetName: d.permStreetName ?? "",
    tempHouseNo: d.permHouseNo ?? "",
  });

  // Snapshot of permanent-address fields so the mirror effect re-runs whenever
  // any of them change (while "same as permanent" is on).
  const permSnapshot = JSON.stringify([
    localData.permState, localData.permDistrict, localData.permLocalLevelType, localData.permMunicipality, localData.permWard, localData.permTole, localData.permStreetName, localData.permHouseNo,
  ]);

  // Keep the temporary address mirrored to the permanent one whenever the box is
  // ticked — both when it's first ticked and as the permanent fields change.
  useEffect(() => {
    if (!sameAsPermenant) return;
    const updated = { ...localData, ...mirrorPermToTemp(localData) };
    setLocalData(updated);
    onUpdate("contactDetails", updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sameAsPermenant, permSnapshot]);

  const handleSameAsPermenant = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSameAsPermenant(e.target.checked);
  };

  // ---- field renderers (preserve exact backend field names) ----
  const renderSelect = (name: string, label: string, options: { value: string; label: string }[], required = false, disabled = false) => (
    <SelectField
      label={label}
      name={name}
      value={(localData as any)[name] || ""}
      onChange={handleChange}
      onBlur={handleBlur}
      required={required}
      error={disabled ? undefined : fieldError(name)}
      valid={fieldValid(name)}
      disabled={disabled}
    >
      <option value="">{t("vacancy.selectOption")}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </SelectField>
  );

  const renderText = (name: string, label: string, required = false, placeholder?: string, optional = false, disabled = false) => (
    <TextField
      label={label}
      name={name}
      value={(localData as any)[name] || ""}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder || label}
      required={required}
      optional={optional}
      optionalText={t("vacancy.optional")}
      error={disabled ? undefined : fieldError(name)}
      valid={fieldValid(name)}
      disabled={disabled}
    />
  );

  const renderDistrict = (name: string, label: string, stateName: string, options: string[], disabled = false) => (
    <SearchableSelect
      name={name}
      value={(localData as any)[name] || ""}
      onChange={handleChange}
      options={options}
      label={label}
      placeholder="Search district"
      disabled={disabled || !String((localData as any)[stateName] || "").trim()}
      error={disabled ? undefined : fieldError(name)}
      valid={fieldValid(name)}
      required
    />
  );

  const renderAddressFields = (prefix: "perm" | "temp", isNepali = false) => {
    const suffix = isNepali ? "Nepali" : "";
    const districtOptions = prefix === "perm" ? permDistrictOptions : tempDistrictOptions;
    const ne = isNepali ? " (Nepali)" : "";
    // Temporary address is locked while it mirrors the permanent address.
    const locked = prefix === "temp" && sameAsPermenant;
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {renderSelect(`${prefix}State${suffix}`, `${t("vacancy.state")}${ne}`, provincesDistricts.map((p) => ({ value: p.id, label: p.name })), true, locked)}
        {renderDistrict(`${prefix}District${suffix}`, `${t("vacancy.district")}${ne}`, `${prefix}State${suffix}`, districtOptions, locked)}
        {renderSelect(`${prefix}LocalLevelType${suffix}`, `${t("vacancy.localLevelType")}${ne}`, localLevelTypes, true, locked)}
        {renderText(`${prefix}Municipality${suffix}`, `${t("vacancy.municipality")}${ne}`, true, undefined, false, locked)}
        {renderText(`${prefix}Ward${suffix}`, `${t("vacancy.ward")}${ne}`, true, undefined, false, locked)}
        {renderText(`${prefix}Tole${suffix}`, `${t("vacancy.tole")}${ne}`, true, undefined, false, locked)}
        {renderText(`${prefix}StreetName${suffix}`, `${t("vacancy.streetName")}${ne}`, false, undefined, true, locked)}
        {renderText(`${prefix}HouseNo${suffix}`, `${t("vacancy.houseNo")}${ne}`, false, undefined, true, locked)}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <StepHeader
        stepLabel={`${t("vacancy.step")} 2`}
        title={t("vacancy.contactDetail")}
        subtitle={t("vacancy.contactIntro")}
      />

      <Section icon={MapPin} accent="teal" title={t("vacancy.permanentAddress")}>
        {renderAddressFields("perm", false)}
      </Section>

      <Section
        icon={Navigation}
        accent="sky"
        title={t("vacancy.temporaryAddress")}
        action={
          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800">
            <input
              type="checkbox"
              checked={sameAsPermenant}
              onChange={handleSameAsPermenant}
              className="h-4 w-4 cursor-pointer rounded border-sky-300 text-sky-600 focus:ring-sky-500"
            />
            {t("vacancy.sameAsPermanent")}
          </label>
        }
      >
        {renderAddressFields("temp", false)}
      </Section>

      <Section icon={Phone} accent="emerald" title={t("vacancy.contactInformation")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField
            label={t("vacancy.mobile")}
            name="mobile"
            type="tel"
            inputMode="tel"
            value={localData.mobile || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t("vacancy.mobile")}
            required
            error={fieldError("mobile")}
            valid={fieldValid("mobile")}
          />
          <TextField
            label={t("vacancy.email")}
            name="email"
            type="email"
            inputMode="email"
            value={localData.email || ""}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={t("vacancy.email")}
            required
            error={fieldError("email")}
            valid={fieldValid("email")}
          />
        </div>
      </Section>

      <Section icon={Users} accent="amber" title={t("vacancy.referencesTitle")} subtitle={t("vacancy.referencesHint")}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderText("reference1Name", `${t("vacancy.reference")} 1 — ${t("vacancy.referenceName")}`, false, undefined, true)}
          {renderText("reference1Phone", `${t("vacancy.reference")} 1 — ${t("vacancy.referencePhone")}`, false, undefined, true)}
          {renderText("reference2Name", `${t("vacancy.reference")} 2 — ${t("vacancy.referenceName")}`, false, undefined, true)}
          {renderText("reference2Phone", `${t("vacancy.reference")} 2 — ${t("vacancy.referencePhone")}`, false, undefined, true)}
        </div>
      </Section>
    </div>
  );
}
