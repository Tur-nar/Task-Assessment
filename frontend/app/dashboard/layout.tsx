import AppLayout from "@/components/dashboard/layout";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppLayout>{children}</AppLayout>;
}
