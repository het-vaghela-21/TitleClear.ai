"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
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
import { defaultStateCode, stateConfigs } from "@/lib/states/gujarat";
import { saveProperty } from "@/lib/property-store";
import type { AreaKind, LandType, Property } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function CheckPage() {
  const router = useRouter();
  const state = stateConfigs[defaultStateCode];

  const [areaKind, setAreaKind] = useState<AreaKind>("rural");
  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [village, setVillage] = useState("");
  const [ward, setWard] = useState("");
  const [citySurveyArea, setCitySurveyArea] = useState("");
  const [surveyNo, setSurveyNo] = useState("");
  const [khataNo, setKhataNo] = useState("");
  const [landType, setLandType] = useState<LandType>("agricultural");
  const [ownerNameRef, setOwnerNameRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const talukas = useMemo(
    () => (district ? state.talukasByDistrict[district] ?? [] : []),
    [district, state],
  );

  const canSubmit =
    district.trim() !== "" &&
    surveyNo.trim() !== "" &&
    (areaKind === "rural" ? taluka.trim() !== "" && village.trim() !== "" : ward.trim() !== "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    const property: Property = {
      id: crypto.randomUUID(),
      state: state.code,
      areaKind,
      district,
      taluka: areaKind === "rural" ? taluka : undefined,
      village: areaKind === "rural" ? village : undefined,
      ward: areaKind === "urban" ? ward : undefined,
      citySurveyArea: areaKind === "urban" ? citySurveyArea || undefined : undefined,
      surveyNo,
      khataNo: khataNo || undefined,
      ownerNameRef: ownerNameRef || undefined,
      landType,
      createdAt: new Date().toISOString(),
    };

    saveProperty(property);
    router.push(`/report/${property.id}/assembling`);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-14">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">
            Step 1 of 3
          </p>
          <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight">
            Tell us about the plot
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Use the identifiers on the plot&apos;s existing land record —
            we&apos;ll use them to pull matching entries from the relevant
            government sources.
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-8">
            <div>
              <span className="text-sm font-medium">Area type</span>
              <div className="mt-2 inline-flex rounded-lg border border-input p-1">
                {(["rural", "urban"] as AreaKind[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => setAreaKind(kind)}
                    className={cn(
                      "rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize",
                      areaKind === kind
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {kind}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select
                  value={district}
                  onValueChange={(v) => {
                    setDistrict(v ?? "");
                    setTaluka("");
                  }}
                >
                  <SelectTrigger id="district" className="w-full">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.districts.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {areaKind === "rural" ? (
                <div className="space-y-2">
                  <Label htmlFor="taluka">{state.ruralAreaLabel}</Label>
                  <Select
                    value={taluka}
                    onValueChange={(v) => setTaluka(v ?? "")}
                    disabled={!district}
                  >
                    <SelectTrigger id="taluka" className="w-full">
                      <SelectValue
                        placeholder={district ? "Select taluka" : "Select district first"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {talukas.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="ward">Ward</Label>
                  <Input
                    id="ward"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    placeholder="e.g. Ward 12"
                  />
                </div>
              )}

              {areaKind === "rural" ? (
                <div className="space-y-2">
                  <Label htmlFor="village">Village</Label>
                  <Input
                    id="village"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g. Bavla"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="citySurveyArea">City survey area</Label>
                  <Input
                    id="citySurveyArea"
                    value={citySurveyArea}
                    onChange={(e) => setCitySurveyArea(e.target.value)}
                    placeholder="e.g. TP Scheme 4"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="surveyNo">
                  {areaKind === "rural" ? "Survey no." : "Survey / FP no."}
                </Label>
                <Input
                  id="surveyNo"
                  value={surveyNo}
                  onChange={(e) => setSurveyNo(e.target.value)}
                  placeholder="e.g. 142/2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="khataNo">{state.khataLabel} (optional)</Label>
                <Input
                  id="khataNo"
                  value={khataNo}
                  onChange={(e) => setKhataNo(e.target.value)}
                  placeholder="e.g. 88"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landType">Land type</Label>
                <Select value={landType} onValueChange={(v) => setLandType(v as LandType)}>
                  <SelectTrigger id="landType" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="non-agricultural">Non-agricultural</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-6">
              <Label htmlFor="ownerNameRef">Owner name (optional, for reference only)</Label>
              <Input
                id="ownerNameRef"
                value={ownerNameRef}
                onChange={(e) => setOwnerNameRef(e.target.value)}
                placeholder="Not required — helps you keep track if you're comparing plots"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <p className="text-xs text-muted-foreground">
                We only use these details to look up public records.
              </p>
              <Button type="submit" size="lg" disabled={!canSubmit || submitting}>
                {submitting ? "Starting…" : "Assemble report"}
              </Button>
            </div>
          </form>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
