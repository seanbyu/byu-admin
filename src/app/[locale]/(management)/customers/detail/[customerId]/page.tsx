import CustomerDetailView from '@/features/customers/views/CustomerDetailView';

interface PageProps {
  params: Promise<{ customerId: string }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { customerId } = await params;
  return <CustomerDetailView customerNo={customerId} />;
}
