import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TenantRedirectPage({ params }: Props) {
  const { id } = await params
  // Redirect to the rooms page as that's the main functionality
  redirect(`/tenants/${id}/rooms`)
}