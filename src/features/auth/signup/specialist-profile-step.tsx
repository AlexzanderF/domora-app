import {
  AuthField,
  AuthForm,
  AuthLabel,
  AuthSelect,
  AuthTextarea,
  FieldError,
  Required,
  SecondaryButton,
  SubmitButton,
  TextField,
} from "../auth-ui";
import {
  SPECIALIST_CATEGORIES,
  type SpecialistRegistrationErrors,
} from "../validation";

export interface SpecialistProfileData {
  category: string;
  area: string;
  experienceYears: string;
  bio: string;
  companyName: string;
  eik: string;
}

interface SpecialistProfileStepProps {
  data: SpecialistProfileData;
  errors: SpecialistRegistrationErrors;
  isSubmitting: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => void;
  onBack: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

/** Specialist step 2: professional qualification. */
export function SpecialistProfileStep({
  data,
  errors,
  isSubmitting,
  onChange,
  onBack,
  onSubmit,
}: SpecialistProfileStepProps) {
  return (
    <AuthForm onSubmit={onSubmit}>
      <AuthField>
        <AuthLabel htmlFor="category">
          Сфера на дейност <Required />
        </AuthLabel>
        <AuthSelect
          id="category"
          name="category"
          required
          value={data.category}
          onChange={onChange}
          aria-invalid={Boolean(errors.category)}
          aria-describedby={errors.category ? "category-error" : undefined}
        >
          <option value="">-- Изберете сфера на дейност --</option>
          {SPECIALIST_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </AuthSelect>
        {errors.category && (
          <FieldError id="category-error">{errors.category}</FieldError>
        )}
      </AuthField>

      <TextField
        id="area"
        label="Район на обслужване / Населено място"
        required
        name="area"
        type="text"
        autoComplete="address-level2"
        enterKeyHint="next"
        value={data.area}
        onChange={onChange}
        placeholder="напр. София и района, Пловдив..."
        error={errors.area}
      />

      <TextField
        id="experienceYears"
        errorId="experience-error"
        label="Професионален опит (в години)"
        required
        name="experienceYears"
        type="number"
        min="0"
        max="60"
        step="1"
        inputMode="numeric"
        enterKeyHint="next"
        value={data.experienceYears}
        onChange={onChange}
        placeholder="напр. 5"
        error={errors.experienceYears}
      />

      <AuthField>
        <AuthLabel htmlFor="bio">
          Кратко представяне и извършвани услуги <Required />
        </AuthLabel>
        <AuthTextarea
          id="bio"
          name="bio"
          rows={4}
          required
          value={data.bio}
          onChange={onChange}
          placeholder="Опишете накратко квалификацията си, видовете ремонти/монтажи, с които работите, и оборудването..."
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={errors.bio ? "bio-error" : undefined}
        />
        {errors.bio && <FieldError id="bio-error">{errors.bio}</FieldError>}
      </AuthField>

      <TextField
        id="companyName"
        label="Име на фирма"
        hint="(незадължително)"
        name="companyName"
        type="text"
        autoComplete="organization"
        enterKeyHint="next"
        value={data.companyName}
        onChange={onChange}
        placeholder="напр. Ремонти Про ЕООД"
      />

      <TextField
        id="eik"
        label="ЕИК / БУЛСТАТ"
        hint="(незадължително)"
        name="eik"
        type="text"
        enterKeyHint="done"
        value={data.eik}
        onChange={onChange}
        placeholder="напр. 204567891"
        error={errors.eik}
      />

      <div className="mt-2 flex flex-col gap-3">
        <SubmitButton type="submit" disabled={isSubmitting} className="mt-0">
          {isSubmitting ? "Изпращане..." : "Изпрати за одобрение"}
        </SubmitButton>
        <SecondaryButton type="button" onClick={onBack} className="w-full">
          ← Назад
        </SecondaryButton>
      </div>
    </AuthForm>
  );
}
