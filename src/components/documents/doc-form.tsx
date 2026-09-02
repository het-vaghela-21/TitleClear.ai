"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GujaratiField } from "@/components/documents/gujarati-field";
import type {
  AnyField,
  FieldDef,
  FieldValues,
  FormSection,
  GroupEntry,
  Lang,
} from "@/lib/doc-filler/types";
import { isGroup, ltext } from "@/lib/doc-filler/types";
import { rupeesInWords, toGujaratiDigits } from "@/lib/doc-filler/gujarati";
import { cn } from "@/lib/utils";

/**
 * Renders a template's form sections from the schema. Bilingual labels
 * (primary per uiLang, the other language as a hint), repeating groups with
 * add/remove, and Gujarati typing assist on script fields.
 */
export function DocForm({
  sections,
  values,
  onChange,
  uiLang,
  assistOn,
}: {
  sections: FormSection[];
  values: FieldValues;
  onChange: (next: FieldValues) => void;
  uiLang: Lang;
  /** Global "type in Gujarati" assist default for script fields. */
  assistOn: boolean;
}) {
  // Per-field override of the global assist toggle, keyed by field path.
  const [assistOverrides, setAssistOverrides] = useState<Record<string, boolean>>({});

  const other: Lang = uiLang === "gu" ? "en" : "gu";

  function setPlain(id: string, value: string) {
    onChange({ ...values, [id]: value });
  }

  function setGroupField(groupId: string, index: number, fieldId: string, value: string) {
    const entries = Array.isArray(values[groupId]) ? ([...(values[groupId] as GroupEntry[])]) : [];
    entries[index] = { ...entries[index], [fieldId]: value };
    onChange({ ...values, [groupId]: entries });
  }

  function addEntry(groupId: string) {
    const entries = Array.isArray(values[groupId]) ? ([...(values[groupId] as GroupEntry[])]) : [];
    entries.push({});
    onChange({ ...values, [groupId]: entries });
  }

  function removeEntry(groupId: string, index: number) {
    const entries = Array.isArray(values[groupId]) ? ([...(values[groupId] as GroupEntry[])]) : [];
    entries.splice(index, 1);
    onChange({ ...values, [groupId]: entries });
  }

  function fieldAssist(path: string, field: FieldDef): boolean {
    if (!field.gujarati) return false;
    return assistOverrides[path] ?? assistOn;
  }

  function renderInput(
    field: FieldDef,
    path: string,
    value: string,
    setValue: (v: string) => void,
  ) {
    const placeholder = field.placeholder ? ltext(field.placeholder, uiLang) : undefined;

    if (field.kind === "select") {
      return (
        <Select value={value} onValueChange={(v) => setValue(v ?? "")}>
          <SelectTrigger id={path} className="w-full">
            <SelectValue placeholder={placeholder ?? (uiLang === "gu" ? "પસંદ કરો" : "Select")} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {ltext(opt.label, uiLang)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.kind === "date") {
      return (
        <Input
          id={path}
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      );
    }

    if (field.kind === "number" || field.kind === "money") {
      return (
        <div>
          <div className="relative">
            {field.kind === "money" ? (
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₹
              </span>
            ) : null}
            <Input
              id={path}
              inputMode="numeric"
              value={value}
              placeholder={placeholder}
              onChange={(e) => setValue(e.target.value)}
              className={field.kind === "money" ? "pl-6" : undefined}
            />
          </div>
          {field.kind === "money" && value.trim() !== "" ? (
            <p className="mt-1 text-xs text-muted-foreground" lang={uiLang}>
              {rupeesInWords(value, uiLang)}
            </p>
          ) : null}
        </div>
      );
    }

    if (field.gujarati) {
      return (
        <GujaratiField
          id={path}
          value={value}
          onChange={setValue}
          multiline={field.kind === "textarea"}
          placeholder={placeholder}
          assist={fieldAssist(path, field)}
          onAssistChange={(next) =>
            setAssistOverrides((prev) => ({ ...prev, [path]: next }))
          }
        />
      );
    }

    if (field.kind === "textarea") {
      return (
        <textarea
          id={path}
          value={value}
          rows={3}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
        />
      );
    }

    return (
      <Input
        id={path}
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
      />
    );
  }

  function renderField(
    field: FieldDef,
    path: string,
    value: string,
    setValue: (v: string) => void,
  ) {
    return (
      <div
        key={path}
        className={cn("space-y-1.5", (field.colSpan ?? 1) === 2 && "sm:col-span-2")}
      >
        <Label htmlFor={path} className="flex flex-wrap items-baseline gap-x-2">
          <span>
            {ltext(field.label, uiLang)}
            {field.required ? <span className="text-destructive"> *</span> : null}
          </span>
          <span className="text-[11px] font-normal text-muted-foreground" lang={other}>
            {ltext(field.label, other)}
          </span>
        </Label>
        {renderInput(field, path, value, setValue)}
        {field.help ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {ltext(field.help, uiLang)}
          </p>
        ) : null}
      </div>
    );
  }

  function renderGroup(group: Extract<AnyField, { kind: "group" }>) {
    const entries = Array.isArray(values[group.id]) ? (values[group.id] as GroupEntry[]) : [];
    return (
      <div key={group.id} className="sm:col-span-2 space-y-4">
        {entries.map((entry, index) => (
          <div key={index} className="rounded-lg border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-mono text-[11px] uppercase tracking-wide text-primary">
                {ltext(group.entryLabel, uiLang)}{" "}
                {entries.length > 1
                  ? uiLang === "gu"
                    ? toGujaratiDigits(index + 1)
                    : index + 1
                  : ""}
              </p>
              {entries.length > group.min ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeEntry(group.id, index)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((sub) =>
                renderField(
                  sub,
                  `${group.id}.${index}.${sub.id}`,
                  entry[sub.id] ?? "",
                  (v) => setGroupField(group.id, index, sub.id, v),
                ),
              )}
            </div>
          </div>
        ))}
        {entries.length < group.max ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addEntry(group.id)}
          >
            <Plus className="size-3.5" />
            {group.addLabel
              ? ltext(group.addLabel, uiLang)
              : uiLang === "gu"
                ? `${ltext(group.entryLabel, "gu")} ઉમેરો`
                : `Add ${ltext(group.entryLabel, "en").toLowerCase()}`}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.id}>
          <h3 className="font-serif text-lg font-medium">
            {ltext(section.title, uiLang)}
            <span className="ml-2 text-sm font-normal text-muted-foreground" lang={other}>
              {ltext(section.title, other)}
            </span>
          </h3>
          {section.description ? (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {ltext(section.description, uiLang)}
            </p>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {section.fields.map((field) =>
              isGroup(field)
                ? renderGroup(field)
                : renderField(
                    field,
                    field.id,
                    typeof values[field.id] === "string" ? (values[field.id] as string) : "",
                    (v) => setPlain(field.id, v),
                  ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
