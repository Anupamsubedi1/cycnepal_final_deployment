"use client";

import { useState } from "react";
import { FormField } from "@/services/vacancy-service";
import { Button, EmptyState } from "@/components/admin/ui";

interface FormFieldBuilderProps {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const inputCls =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-[#0d837f] focus:ring-1 focus:ring-[#0d837f]";
const fieldLabelCls =
  "mb-1 block text-sm font-semibold uppercase tracking-[0.18em] text-[#0d837f]";

export default function FormFieldBuilder({
  fields,
  onChange,
}: FormFieldBuilderProps): React.JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: "New Field",
      type: "text",
      required: false,
    };
    onChange([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    onChange(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field,
      ),
    );
  };

  const removeField = (id: string) => {
    onChange(fields.filter((field) => field.id !== id));
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const index = fields.findIndex((f) => f.id === id);
    if (
      (direction === "up" && index > 0) ||
      (direction === "down" && index < fields.length - 1)
    ) {
      const newFields = [...fields];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newFields[index], newFields[targetIndex]] = [
        newFields[targetIndex],
        newFields[index],
      ];
      onChange(newFields);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 className="text-lg font-semibold text-slate-900">Application Form Fields</h3>
        <Button size="sm" onClick={addField}>
          + Add Field
        </Button>
      </div>

      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4"
          >
            {editingId === field.id ? (
              <div className="space-y-3">
                <div>
                  <label className={fieldLabelCls}>Label</label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateField(field.id, { label: e.target.value })
                    }
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={fieldLabelCls}>Field Type</label>
                  <select
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, {
                        type: e.target.value as FormField["type"],
                      })
                    }
                    className={inputCls}
                  >
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select/Dropdown</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="pdf">PDF Upload</option>
                  </select>
                </div>

                {(field.type === "select" || field.type === "checkbox") && (
                  <div>
                    <label className={fieldLabelCls}>Options (comma-separated)</label>
                    <input
                      type="text"
                      value={field.options?.join(", ") || ""}
                      onChange={(e) =>
                        updateField(field.id, {
                          options: e.target.value
                            .split(",")
                            .map((o) => o.trim())
                            .filter((o) => o),
                        })
                      }
                      placeholder="Option 1, Option 2, Option 3"
                      className={inputCls}
                    />
                  </div>
                )}

                {field.type !== "pdf" && (
                  <div>
                    <label className={fieldLabelCls}>Placeholder</label>
                    <input
                      type="text"
                      value={field.placeholder || ""}
                      onChange={(e) =>
                        updateField(field.id, { placeholder: e.target.value })
                      }
                      className={inputCls}
                    />
                  </div>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) =>
                      updateField(field.id, { required: e.target.checked })
                    }
                    className="accent-[#0d837f]"
                  />
                  <span className="text-sm text-slate-700">Required</span>
                </label>

                <Button size="sm" onClick={() => setEditingId(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{field.label}</p>
                  <p className="text-sm text-slate-600">
                    Type: {field.type}
                    {field.required && " • Required"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => moveField(field.id, "up")}
                    disabled={index === 0}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveField(field.id, "down")}
                    disabled={index === fields.length - 1}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    ↓
                  </button>
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(field.id)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => removeField(field.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <EmptyState
          title="No fields added"
          description={`Click "Add Field" to create the application form.`}
        />
      )}
    </div>
  );
}
