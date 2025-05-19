import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <div className="relative min-h-[65vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-b from-[#010042] to-[#0100a3]"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="lg:flex lg:flex-col lg:justify-center">
              <h1 className="text-5xl font-bold mb-8 text-white lg:max-w-xl">
                Connect with skilled freelancers across Indonesia
              </h1>
              <p className="text-xl text-gray-200 leading-relaxed mb-8 lg:max-w-xl">
                SkillNusa is a marketplace connecting talented Indonesian freelancers with clients looking for quality services.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/register"
                  className="text-sm px-8 py-4 rounded-lg bg-white text-[#010042] font-medium transition duration-300 hover:bg-opacity-90 hover:shadow-lg"
                >
                  Join SkillNusa
                </Link>
                <Link
                  to="/browse"
                  className="text-sm px-8 py-4 rounded-lg bg-transparent border border-white text-white font-medium transition duration-300 hover:bg-white/10"
                >
                  Browse Services
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://picsum.photos/seed/skillnusa/987/740"
                alt="Freelancer working"
                className="rounded-2xl object-cover shadow-xl w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Popular Gigs Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-[#010042]">Popular Gigs</h2>
            <Link to="/browse" className="text-sm text-[#010042] hover:underline flex items-center gap-2">
              View all gigs
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                image: "https://picsum.photos/seed/gig1/400/300",
                title: "Professional Logo Design",
                category: "Design & Creative",
                freelancer: "Andi Pratama",
                rating: "4.9",
                reviews: "87",
                price: "Rp 750.000"
              },
              {
                image: "https://picsum.photos/seed/gig2/400/300",
                title: "Full-Stack Web Development",
                category: "Programming & Tech",
                freelancer: "Budi Santoso",
                rating: "4.8",
                reviews: "124",
                price: "Rp 3.500.000"
              },
              {
                image: "https://picsum.photos/seed/gig3/400/300",
                title: "Social Media Management",
                category: "Digital Marketing",
                freelancer: "Dina Wijaya",
                rating: "4.7",
                reviews: "56",
                price: "Rp 1.200.000"
              },
              {
                image: "https://picsum.photos/seed/gig4/400/300",
                title: "Mobile App Development",
                category: "Mobile Development",
                freelancer: "Farhan Ahmad",
                rating: "5.0",
                reviews: "32",
                price: "Rp 5.000.000"
              }
            ].map((gig, index) => (
              <Link to="/service/detail" key={index} className="block group">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-[#010042]/30">
                  <div className="h-44 overflow-hidden">
                    <img 
                      src={gig.image} 
                      alt={gig.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-[#010042]/10 text-[#010042] rounded-full">
                        {gig.category}
                      </span>
                    </div>
                    <h3 className="font-semibold text-base mb-2 text-gray-800 line-clamp-1">
                      {gig.title}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-[#010042]/10 flex items-center justify-center text-xs font-bold text-[#010042]">
                        {gig.freelancer.charAt(0)}
                      </div>
                      <span className="text-xs text-gray-600">{gig.freelancer}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-xs font-medium">{gig.rating}</span>
                      <span className="text-xs text-gray-500">({gig.reviews})</span>
                    </div>
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[#010042] font-semibold text-sm">
                        {gig.price}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-[#010042]">Popular Categories</h2>
            <Link to="/browse" className="text-sm text-[#010042] hover:underline flex items-center gap-2">
              View all categories
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", name: "Design & Creative" },
              { icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4", name: "Programming & Tech" },
              { icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", name: "Writing & Translation" },
              { icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", name: "Digital Marketing" },
              { icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z", name: "Mobile Development" },
              { icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10", name: "Business" },
              { icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z", name: "Customer Support" },
              { icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", name: "Video & Animation" }
            ].map((category, index) => (
              <Link to="/browse" key={index} className="group block">
                <div className="bg-white rounded-xl p-6 border border-gray-200 transition-all duration-300 hover:shadow-md hover:border-[#010042]/30 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#010042]/10 transition-all duration-300 group-hover:bg-[#010042]/20">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={category.icon} />
                    </svg>
                  </div>
                  <span className="font-medium text-gray-800">{category.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-[#010042]">How SkillNusa Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our platform makes it easy to connect with skilled professionals or find clients for your services.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#010042]">Find Services</h3>
              <p className="text-gray-600">
                Browse through various categories to find the perfect freelancer for your project needs.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#010042]">Connect & Collaborate</h3>
              <p className="text-gray-600">
                Communicate with freelancers, discuss your project details, and agree on deliverables.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#010042]">Get Work Done</h3>
              <p className="text-gray-600">
                Pay securely and receive quality work from skilled Indonesian freelancers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#010042] to-[#0100a3] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to get started with SkillNusa?</h2>
            <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto">
              Join thousands of freelancers and clients already growing their businesses with SkillNusa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="text-sm px-8 py-4 rounded-lg bg-white text-[#010042] font-medium transition duration-300 hover:bg-opacity-90 hover:shadow-lg"
              >
                Sign Up as Freelancer
              </Link>
              <Link
                to="/register"
                className="text-sm px-8 py-4 rounded-lg bg-[#0100a3] text-white border border-white font-medium transition duration-300 hover:bg-[#0100a3]/80"
              >
                Hire a Freelancer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}