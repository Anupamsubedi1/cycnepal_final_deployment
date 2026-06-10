"use client";

import { useState } from "react";
import { FormField } from "@/services/vacancy-service";

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (formData: FormData) => Promise<void>;
  loading: boolean;
}

export default function DynamicForm({
  fields,
  onSubmit,
  loading,
}: DynamicFormProps): React.JSX.Element {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const newErrors: { [key: string]: string } = {};

    // Validate required fields
    for (const field of fields) {
      if (field.required) {
        const value = formData.get(field.id);
        if (!value || (typeof value === "string" && value.trim() === "")) {
          newErrors[field.id] = `${field.label} is required`;
        }
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fields.map((field) => (
        <div key={field.id} className="space-y-2">
          <label className="block text-sm font-medium">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>

          {field.type === "text" && (
            <input
              type="text"
              name={field.id}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {field.type === "email" && (
            <input
              type="email"
              name={field.id}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {field.type === "phone" && (
            <input
              type="tel"
              name={field.id}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {field.type === "textarea" && (
            <textarea
              name={field.id}
              placeholder={field.placeholder}
              required={field.required}
              rows={4}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {field.type === "select" && (
            <select
              name={field.id}
              required={field.required}
              defaultValue=""
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select {field.label}</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {field.type === "checkbox" && (
            <div className="space-y-2">
              {field.options?.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={field.id}
                    value={option}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          )}

          {field.type === "pdf" && (
            <input
              type="file"
              name={field.id}
              accept=".pdf,.doc,.docx"
              required={field.required}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {errors[field.id] && (
            <p className="text-red-500 text-sm">{errors[field.id]}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
      >
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
