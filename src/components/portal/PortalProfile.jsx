import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, HeartPulse, Loader2, UserRound } from "lucide-react";
import { portalData } from "../../lib/portal";

const KG_PER_LB = 0.45359237;
const kgToLb = (kg) => (kg == null ? "" : String(Math.round(kg / KG_PER_LB)));
const lbToKg = (lb) => (lb === "" ? null : Number((Number(lb) * KG_PER_LB).toFixed(2)));

const cmToFtIn = (cm) => {
  if (cm == null) return { ft: "", in: "" };
  const total = Math.round(cm / 2.54);
  return { ft: String(Math.floor(total / 12)), in: String(total % 12) };
};
const ftInToCm = (ft, inch) => {
  if (ft === "" && inch === "") return null;
  return Number(((Number(ft || 0) * 12 + Number(inch || 0)) * 2.54).toFixed(1));
};

const SECTIONS = [
  { key: "details", label: "Profile details", icon: UserRound },
  { key: "medical", label: "Medical details", icon: HeartPulse },
];

const label = "mb-1.5 block text-[0.8rem] font-medium text-muted";
const field =
  "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-[0.92rem] text-ink placeholder:text-muted/60 focus:border-primary focus:outline-none disabled:text-muted";

function Card({ icon, title, note, children, onSave, saving, saved, error }) {
  const Icon = icon;
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(); }}
      className="rounded-2xl border border-line bg-surface p-6 nv-shadow sm:p-7"
    >
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
          <Icon size={16} />
        </span>
        <div>
          <h2 className="text-[1.08rem] leading-tight text-ink">{title}</h2>
          {note && <p className="mt-0.5 text-[0.8rem] text-muted">{note}</p>}
        </div>
      </div>

      {children}

      {error && (
        <p role="alert" className="mt-4 flex items-center gap-1.5 text-[0.85rem] text-ink">
          <AlertCircle size={14} className="shrink-0 text-primary" /> {error}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-[0.9rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : "Save changes"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-[0.85rem] font-medium text-primary">
            <Check size={15} /> Saved
          </span>
        )}
      </div>
    </form>
  );
}

export default function PortalProfile({ onUnauthorized }) {
  const [profile, setProfile] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(null); // 'details' | 'medical'
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState({});
  // One card at a time — the two stacked made for a very long scroll.
  const [section, setSection] = useState("details");

  useEffect(() => {
    portalData({ resource: "profile" })
      .then(({ profile: p }) => {
        setProfile(p);
        const { ft, in: inch } = cmToFtIn(p.height);
        setForm({
          ...p,
          address: p.address || { address: "", address2: "", zip_code: "", city_name: "", state_name: "" },
          weight_lb: kgToLb(p.weight),
          height_ft: ft,
          height_in: inch,
        });
      })
      .catch((err) => {
        if (err.status === 401) return onUnauthorized();
        setLoadError(err.message);
      });
  }, [onUnauthorized]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setAddr = (patch) => setForm((f) => ({ ...f, address: { ...f.address, ...patch } }));

  async function save(section, payload) {
    setBusy(section);
    setSaved(null);
    setError({});
    try {
      const { profile: next } = await portalData({ resource: "update_profile", profile: payload });
      setProfile(next);
      setSaved(section);
    } catch (err) {
      if (err.status === 401) return onUnauthorized();
      setError({ [section]: err.message });
    } finally {
      setBusy(null);
    }
  }

  if (loadError) {
    return (
      <div className="nv-scroll min-h-0 flex-1 overflow-y-auto px-5 py-8" data-lenis-prevent>
        <p role="alert" className="mx-auto flex max-w-3xl items-center gap-2 text-[0.9rem] text-ink">
          <AlertCircle size={15} className="text-primary" /> {loadError}
        </p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="grid flex-1 place-items-center">
        <Loader2 size={26} className="animate-spin text-primary" />
      </div>
    );
  }

  const isFemale = String(form.gender) === "2" || form.gender_label === "Female";

  return (
    <div className="nv-scroll min-h-0 flex-1 overflow-y-auto px-5 py-8" data-lenis-prevent>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-[1.45rem] leading-tight text-ink">Your details</h1>
          <p className="mt-1 text-[0.9rem] text-muted">
            Keeping this current helps your clinician prescribe safely.
          </p>
        </div>

        <div className="inline-flex w-fit gap-1 rounded-full border border-line bg-surface p-1">
          {SECTIONS.map(({ key, label, icon }) => {
            // Assigned rather than destructured as `icon: Icon` — the repo's
            // no-unused-vars only exempts capitalised variables, not params.
            const Icon = icon;
            const active = section === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSection(key)}
                aria-pressed={active}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-[0.85rem] font-semibold transition-colors ${
                  active ? "text-on-primary" : "text-muted hover:text-ink"
                }`}
              >
                {/* The filled pill is a single shared element that animates between
                    options, rather than two backgrounds cross-fading. */}
                {active && (
                  <motion.span
                    layoutId="portal-profile-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                  <Icon size={15} className="shrink-0" /> {label}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {section === "details" && (
              <Card
                icon={UserRound}
                title="Profile details"
                note="Where your medication ships and how we reach you"
                saving={busy === "details"}
                saved={saved === "details"}
                error={error.details}
                onSave={() =>
                  save("details", {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    phone_number: form.phone_number,
                    date_of_birth: form.date_of_birth,
                    gender: form.gender === null || form.gender === "" ? undefined : Number(form.gender),
                    pregnancy: isFemale ? Boolean(form.pregnancy) : false,
                    is_sms_enabled: form.is_sms_enabled,
                    is_email_enabled: form.is_email_enabled,
                    address: form.address,
                  })
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="p-first">First name</label>
                    <input id="p-first" className={field} value={form.first_name}
                      onChange={(e) => set({ first_name: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-last">Last name</label>
                    <input id="p-last" className={field} value={form.last_name}
                      onChange={(e) => set({ last_name: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-sex">Sex</label>
                    <select id="p-sex" className={field} value={form.gender ?? ""}
                      onChange={(e) => set({ gender: e.target.value })}>
                      <option value="">Prefer not to say</option>
                      <option value="1">Male</option>
                      <option value="2">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="p-dob">Date of birth</label>
                    <input id="p-dob" type="date" className={field} value={form.date_of_birth || ""}
                      onChange={(e) => set({ date_of_birth: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-email">Email</label>
                    <input id="p-email" className={field} value={form.email} disabled />
                    <p className="mt-1 text-[0.75rem] text-muted">
                      This is your sign-in address. Contact support to change it.
                    </p>
                  </div>
                  <div>
                    <label className={label} htmlFor="p-phone">Phone</label>
                    <input id="p-phone" type="tel" className={field} value={form.phone_number}
                      onChange={(e) => set({ phone_number: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-state">State</label>
                    <input id="p-state" className={field} value={form.address.state_name}
                      onChange={(e) => setAddr({ state_name: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-city">City</label>
                    <input id="p-city" className={field} value={form.address.city_name}
                      onChange={(e) => setAddr({ city_name: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-addr">Address</label>
                    <input id="p-addr" className={field} value={form.address.address}
                      onChange={(e) => setAddr({ address: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="p-zip">ZIP code</label>
                    <input id="p-zip" inputMode="numeric" className={field} value={form.address.zip_code}
                      onChange={(e) => setAddr({ zip_code: e.target.value })} />
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-line pt-5">
                  {isFemale && (
                    <label className="flex items-start gap-2.5 text-[0.9rem] text-ink">
                      <input type="checkbox" checked={Boolean(form.pregnancy)}
                        onChange={(e) => set({ pregnancy: e.target.checked })}
                        className="mt-0.5 h-4 w-4 accent-primary" />
                      <span>
                        I am pregnant
                        <span className="block text-[0.78rem] text-muted">
                          Some medications aren't recommended during pregnancy.
                        </span>
                      </span>
                    </label>
                  )}
                  <label className="flex items-center gap-2.5 text-[0.9rem] text-ink">
                    <input type="checkbox" checked={form.is_sms_enabled}
                      onChange={(e) => set({ is_sms_enabled: e.target.checked })}
                      className="h-4 w-4 accent-primary" />
                    Receive SMS for medical notifications
                  </label>
                  <label className="flex items-center gap-2.5 text-[0.9rem] text-ink">
                    <input type="checkbox" checked={form.is_email_enabled}
                      onChange={(e) => set({ is_email_enabled: e.target.checked })}
                      className="h-4 w-4 accent-primary" />
                    Receive emails for medical notifications
                  </label>
                </div>
              </Card>
            )}

            {section === "medical" && (
              <Card
                icon={HeartPulse}
                title="Medical details"
                note="Shared with your clinician when they review your case"
                saving={busy === "medical"}
                saved={saved === "medical"}
                error={error.medical}
                onSave={() =>
                  save("medical", {
                    weight: lbToKg(form.weight_lb),
                    height: ftInToCm(form.height_ft, form.height_in),
                    blood_pressure: form.blood_pressure,
                    // Body temperature and oxygen saturation are no longer shown
                    // here, so they're left out of the payload entirely — MDI
                    // merges on write, and sending null would quietly erase
                    // readings a clinician recorded.
                    current_medications: form.current_medications,
                    allergies: form.allergies,
                    medical_conditions: form.medical_conditions,
                  })
                }
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className={label} htmlFor="m-weight">Weight (lb)</label>
                    <input id="m-weight" inputMode="numeric" className={field} value={form.weight_lb}
                      onChange={(e) => set({ weight_lb: e.target.value })} />
                  </div>
                  <div>
                    <span className={label}>Height</span>
                    <div className="flex gap-2">
                      <input aria-label="Feet" inputMode="numeric" placeholder="ft" className={field}
                        value={form.height_ft} onChange={(e) => set({ height_ft: e.target.value })} />
                      <input aria-label="Inches" inputMode="numeric" placeholder="in" className={field}
                        value={form.height_in} onChange={(e) => set({ height_in: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={label} htmlFor="m-bp">Blood pressure</label>
                    <input id="m-bp" placeholder="120/80" className={field} value={form.blood_pressure}
                      onChange={(e) => set({ blood_pressure: e.target.value })} />
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className={label} htmlFor="m-meds">Current medications</label>
                    <textarea id="m-meds" rows={2} data-lenis-prevent className={`${field} resize-y`}
                      placeholder="None" value={form.current_medications}
                      onChange={(e) => set({ current_medications: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="m-allergies">Allergies</label>
                    <textarea id="m-allergies" rows={2} data-lenis-prevent className={`${field} resize-y`}
                      placeholder="No known drug allergies" value={form.allergies}
                      onChange={(e) => set({ allergies: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="m-conditions">Medical conditions</label>
                    <textarea id="m-conditions" rows={2} data-lenis-prevent className={`${field} resize-y`}
                      placeholder="No known medical conditions" value={form.medical_conditions}
                      onChange={(e) => set({ medical_conditions: e.target.value })} />
                  </div>
                </div>
              </Card>
            )}
          </motion.div>
        </AnimatePresence>

        <p className="pb-4 text-center text-[0.78rem] text-muted">
          Signed in as {profile?.email}
        </p>
      </div>
    </div>
  );
}
