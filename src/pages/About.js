import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';

export default function About() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Fungsi untuk menangani klik pada link yang memerlukan login
  const handleAuthRequiredClick = (e, targetPath) => {
    if (!currentUser) {
      e.preventDefault();
      navigate(ROUTES.LOGIN);
    } else {
      navigate(targetPath);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div className="relative bg-gray-50 pt-24 pb-12">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Image Section */}
            <div className="relative w-full h-auto rounded-3xl shadow-lg overflow-hidden">
              <img
                src="/images/team.jpg"
                alt="Team member working"
                className="w-full aspect-[16/10] object-cover object-[50%_28%]"
              />
            </div>

            {/* Right Content Section */}
            <div className="flex flex-col justify-center md:pl-12 lg:pl-16">
              <h1 className="text-6xl font-bold tracking-tight mb-8">
                TENTANG KAMI
              </h1>
              <div className="space-y-6 text-gray-600">
                <p className="text-lg leading-relaxed">
                  SkillNusa lahir dari visi untuk menghubungkan talenta terbaik Indonesia dengan peluang global. 
                  Kami percaya bahwa setiap individu memiliki keahlian unik yang dapat memberikan nilai tambah bagi dunia.
                </p>
                <p className="text-lg leading-relaxed">
                  Saat ini, kami membangun marketplace yang mendemokratisasi akses ke pekerjaan freelance berkualitas, 
                  memungkinkan para profesional Indonesia untuk berkembang dan mencapai potensi penuh mereka.
                </p>
                <p className="text-lg leading-relaxed">
                  Misi kami adalah menciptakan ekosistem yang mendukung pertumbuhan ekonomi kreatif Indonesia 
                  melalui platform yang aman, transparan, dan memberikan nilai tambah bagi semua pihak.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            
            
            {/* How SkillNusa Works Section */}
            <div className="bg-white rounded-xl shadow-md p-8 md:p-10 mb-10">
              <h2 className="text-2xl font-semibold text-[#010042] mb-6">Cara Kerja SkillNusa</h2>
              <p className="text-gray-700 mb-6">
                Platform kami memudahkan Anda untuk terhubung dengan profesional terampil atau menemukan klien untuk layanan Anda.
              </p>
              
              <div className="grid md:grid-cols-3 gap-8 mt-8">
                <div 
                  className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  onClick={(e) => handleAuthRequiredClick(e, '/services')}
                >
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#010042]">Cari Layanan</h3>
                  <p className="text-gray-600">
                  Jelajahi berbagai kategori untuk menemukan freelancer yang tepat untuk kebutuhan proyek Anda.
                  </p>
                </div>

                <div 
                  className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  onClick={(e) => handleAuthRequiredClick(e, '/connect')}
                >
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#010042]">Terhubung & Kolaborasi</h3>
                  <p className="text-gray-600">
                  Komunikasi dengan freelancer, diskusikan detail proyek, dan setujui kelengkapan.
                  </p>
                </div>

                <div 
                  className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
                  onClick={(e) => handleAuthRequiredClick(e, '/projects')}
                >
                  <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-[#010042]">Dapatkan Pekerjaan</h3>
                  <p className="text-gray-600">
                  Bayar dengan aman dan dapatkan pekerjaan berkualitas dari freelancer Indonesia terampil.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 md:p-10 mb-10">
              <h2 className="text-2xl font-semibold text-[#010042] mb-6">Tim Kami</h2>
              <p className="text-gray-700 mb-6">
                SkillNusa didirikan oleh sekelompok profesional yang memiliki latar belakang di bidang teknologi, bisnis, dan desain. Kami memahami tantangan yang dihadapi oleh freelancer dan bisnis dalam ekosistem digital Indonesia.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                {[
                  { name: "Andi Pratama", role: "CEO & Co-founder", image: "https://picsum.photos/seed/ceo/300/300" },
                  { name: "Budi Santoso", role: "CTO & Co-founder", image: "https://picsum.photos/seed/cto/300/300" },
                  { name: "Citra Wijaya", role: "COO & Co-founder", image: "https://picsum.photos/seed/coo/300/300" }
                ].map((member, index) => (
                  <div key={index} className="text-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#010042]/10">
                      <img 
                        src={member.image} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-lg text-gray-800">{member.name}</h3>
                    <p className="text-gray-600">{member.role}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-8 md:p-10 mb-10">
              <h2 className="text-2xl font-semibold text-[#010042] mb-6">Visi Ke Depan</h2>
              <p className="text-gray-700 mb-6">
                Kami memiliki visi untuk menjadikan SkillNusa sebagai platform freelance terdepan di Indonesia dan Asia Tenggara. Kami ingin menciptakan ribuan peluang bagi talenta Indonesia dan membantu bisnis menemukan solusi terbaik untuk kebutuhan mereka.
              </p>
              <p className="text-gray-700">
                Dengan terus berinovasi dan meningkatkan layanan kami, kami berharap dapat berkontribusi pada perkembangan ekonomi digital Indonesia dan membantu meningkatkan taraf hidup masyarakat melalui peluang kerja digital.
              </p>
            </div>
            
            <div className="text-center mb-8">
              <Link 
                to="/register" 
                className="inline-flex items-center px-8 py-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] transition-colors duration-300"
              >
                Bergabung dengan SkillNusa
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 