import { redirect } from "next/navigation";

export default async function ClientSlugPage({
  params,
}: {
  params: Promise<{ "client-slug": string }>;
}) {
  const { "client-slug": slug } = await params;
  redirect(`/dashboard`);
}
