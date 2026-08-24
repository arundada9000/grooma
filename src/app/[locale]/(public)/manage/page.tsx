import type { Metadata } from "next";
import { getTranslator } from "@/i18n/server";
import { ManageTokenForm } from "@/components/manage/manage-token-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return { title: t("manage.title") };
}

export default async function ManageEntryPage() {
  const { t } = await getTranslator();
  return (
    <ManageTokenForm
      labels={{
        title: t("manage.title"),
        subtitle: t("book.confirmedSubtitle"),
        placeholder: "cD7xw9…",
        submit: t("nav.manage"),
        invalid: t("book.errors.NOT_FOUND"),
      }}
    />
  );
}
