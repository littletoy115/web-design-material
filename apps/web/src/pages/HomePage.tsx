export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b">
        <span className="text-xl font-bold text-blue-600">MyBrand</span>
        <div className="flex gap-6 text-sm text-gray-600">
          <a href="#features" className="hover:text-blue-600">Features</a>
          <a href="#pricing" className="hover:text-blue-600">Pricing</a>
          <a href="#contact" className="hover:text-blue-600">Contact</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-32 bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Build something <span className="text-blue-600">amazing</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mb-8">
          The fastest way to launch your product. Simple, powerful, and beautiful out of the box.
        </p>
        <div className="flex gap-4">
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">
            Get Started
          </button>
          <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-medium">
            Learn More
          </button>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-8 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why choose us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { title: 'Fast', desc: 'Optimized for speed from day one.' },
            { title: 'Secure', desc: 'Enterprise-grade security built in.' },
            { title: 'Scalable', desc: 'Grows with your business effortlessly.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-xl border hover:shadow-md transition">
              <h3 className="text-xl font-semibold mb-2 text-gray-800">{f.title}</h3>
              <p className="text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} MyBrand. All rights reserved.
      </footer>
    </div>
  );
}
