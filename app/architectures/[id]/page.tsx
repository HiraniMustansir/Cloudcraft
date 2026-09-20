import { ArchitectureDetail } from '@/app/components/architecture-detail';

export default async function ArchitecturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ArchitectureDetail id={id} />;
}
