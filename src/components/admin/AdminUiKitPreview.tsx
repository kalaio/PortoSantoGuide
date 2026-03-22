"use client";

import { useState } from "react";
import {
  ADMIN_FORM_CLASS,
  ADMIN_FIELD_ROW_CLASS,
  ADMIN_FORM_SECTION_TIGHT_CLASS,
  ADMIN_UI_KIT_BADGE_ROW_CLASS,
  ADMIN_UI_KIT_BUTTON_ROW_CLASS,
  ADMIN_UI_KIT_CARD_GRID_CLASS,
  ADMIN_UI_KIT_STACK_CLASS,
  ADMIN_UI_KIT_UPLOAD_PREVIEW_CLASS
} from "@/components/admin/admin-tailwind";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CheckboxField,
  Field,
  FileTriggerButton,
  FormSection,
  SelectInput,
  TextArea,
  TextInput
} from "@/components/ui";

const WAIT_MS = 450;

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function AdminUiKitPreview() {
  const [title, setTitle] = useState("Sample listing title");
  const [description, setDescription] = useState("Short description for UI preview.");
  const [status, setStatus] = useState("true");
  const [isFeatured, setIsFeatured] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lastFile, setLastFile] = useState("");

  return (
    <div className={ADMIN_UI_KIT_STACK_CLASS}>
      <Card as="section" title="Buttons" description="Variants, sizes, and states used in admin pages.">
        <div className={ADMIN_UI_KIT_BUTTON_ROW_CLASS}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <ButtonLink size="sm" href="/admin">
            Link Button
          </ButtonLink>
        </div>
      </Card>

      <Card as="section" title="Form Controls" description="Reusable input components and common field combinations.">
        <FormSection title="Edit Form Example" className={ADMIN_FORM_SECTION_TIGHT_CLASS}>
          <form className={ADMIN_FORM_CLASS} onSubmit={(event) => event.preventDefault()}>
            <Field label="Title">
              <TextInput value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>

            <Field label="Description">
              <TextArea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>

            <div className={ADMIN_FIELD_ROW_CLASS}>
              <Field label="Status">
                <SelectInput value={status} onChange={(event) => setStatus(event.target.value)}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </SelectInput>
              </Field>

              <Field label="Readonly slug">
                <TextInput value="sample-listing" readOnly />
              </Field>
            </div>

            <CheckboxField label="Featured listing" checked={isFeatured} onChange={setIsFeatured} />

            <div className={ADMIN_UI_KIT_BUTTON_ROW_CLASS}>
              <Button type="submit" variant="secondary">
                Save Changes
              </Button>
              <Button type="button" variant="danger">
                Delete
              </Button>
            </div>
          </form>
        </FormSection>
      </Card>

      <div className={ADMIN_UI_KIT_CARD_GRID_CLASS}>
        <Card as="section" title="Badges">
          <div className={ADMIN_UI_KIT_BADGE_ROW_CLASS}>
            <Badge tone="neutral">Draft</Badge>
            <Badge tone="success">Published</Badge>
            <Badge tone="danger">Archived</Badge>
          </div>
        </Card>

        <Card as="section" title="File Trigger">
          <div className={ADMIN_UI_KIT_UPLOAD_PREVIEW_CLASS}>
            <FileTriggerButton
              accept="image/jpeg,image/png,image/webp,image/avif"
              idleLabel="Upload image"
              uploading={uploading}
              onSelect={async (file) => {
                setUploading(true);
                setLastFile(file.name);
                await delay(WAIT_MS);
                setUploading(false);
              }}
            />
            <p className="muted">{lastFile || "No file selected yet."}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
