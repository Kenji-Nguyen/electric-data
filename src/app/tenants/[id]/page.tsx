import { redirect } from 'next/navigation'

interface Props {
  params: { id: string }
}

export default async function TenantRedirectPage({ params }: Props) {
  // Redirect to the rooms page as that's the main functionality
  redirect(`/tenants/${params.id}/rooms`)
}