import Link from "next/link";

export default function HomePage() {
  const features = [
    { icon: "🚆", label: "Train Seat", desc: "Coach, berth & seat type" },
    { icon: "👨‍👩‍👧", label: "Family Seats", desc: "All family members together" },
    { icon: "🏨", label: "Hotel", desc: "Hotel name & details" },
    { icon: "🔑", label: "Room Number", desc: "Floor & room assignment" },
  ];

  return (
    <div className="min-h-[calc(100vh-8rem)]">
      {/* Hero section */}
      <section className="relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-transparent" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-20 lg:pt-28 sm:pb-16 lg:pb-20">
          {/* Desktop: side-by-side hero | Mobile: stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 border border-slate-200 shadow-sm mb-6">
                <span className="text-2xl">🚆</span>
                <span className="text-sm font-semibold text-slate-700">
                  Trip Management
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem] font-bold text-slate-900 tracking-tight leading-tight">
                Your complete trip information{" "}
                <span className="text-slate-500">in one place</span>
              </h1>

              <p className="mt-4 text-base sm:text-lg text-slate-500 max-w-lg mx-auto lg:mx-0">
                Find your train seat, family seat assignments, hotel details, and
                room numbers — all with your mobile number.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/passenger"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white
                             font-semibold text-base rounded-xl
                             hover:bg-slate-800 active:bg-slate-950
                             transition-colors duration-200
                             shadow-lg shadow-slate-900/10"
                >
                  Find My Details
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  href="/admin"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700
                             font-semibold text-base rounded-xl border border-slate-200
                             hover:bg-slate-50 active:bg-slate-100
                             transition-colors duration-200"
                >
                  Admin Panel
                </Link>
              </div>
            </div>

            {/* Right: Feature preview cards (desktop) */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature.label}
                  className="bg-white rounded-2xl border border-slate-200 p-6
                             text-center hover:shadow-md hover:border-slate-300
                             transition-all duration-200"
                >
                  <span className="text-4xl">{feature.icon}</span>
                  <h3 className="mt-3 font-bold text-base text-slate-800">
                    {feature.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mobile feature cards (only on mobile/tablet) */}
      <section className="lg:hidden max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6
                         text-center hover:shadow-md hover:border-slate-300
                         transition-all duration-200"
            >
              <span className="text-3xl sm:text-4xl">{feature.icon}</span>
              <h3 className="mt-3 font-bold text-sm sm:text-base text-slate-800">
                {feature.label}
              </h3>
              <p className="mt-1 text-xs text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 lg:p-12">
          <h2 className="text-lg lg:text-xl font-bold text-slate-800 text-center">
            How it works
          </h2>
          <div className="mt-6 lg:mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-12">
            {[
              {
                step: "1",
                title: "Enter your number",
                desc: "Use the registered mobile number shared during booking.",
              },
              {
                step: "2",
                title: "View your details",
                desc: "See your train coach, berth, and hotel room assignment.",
              },
              {
                step: "3",
                title: "Check family seats",
                desc: "View all your family members' seat allocations at once.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto font-bold text-sm lg:text-base">
                  {item.step}
                </div>
                <h3 className="mt-3 font-semibold text-sm lg:text-base text-slate-800">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs lg:text-sm text-slate-500 max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
