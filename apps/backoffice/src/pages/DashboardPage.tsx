export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-3 gap-6">
        {[{ label: 'Total Users', value: '—' }, { label: 'Active Sessions', value: '—' }, { label: 'Revenue', value: '—' }].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-6 shadow">
            <p className="text-gray-500 text-sm">{card.label}</p>
            <p className="text-3xl font-bold mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
