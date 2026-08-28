import AccountDetail from "../../../components/AccountDetail";
export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <AccountDetail id={id} />; }
