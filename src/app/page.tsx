import Header from "@/components/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Header
        title="Dashboard"
        breadcrumb={["Dashboard"]}
      />
    </div>
  );
}
