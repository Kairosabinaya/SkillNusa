import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import PageContainer from '../components/common/PageContainer';

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
        <PageContainer maxWidth="max-w-7xl">
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
        </PageContainer>
      </div>

      {/* Tim Kami Section */}
      <PageContainer maxWidth="max-w-7xl" padding="px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-4xl font-bold mb-2">Tim Kami</h2>
            <div className="w-24 h-1 bg-blue-600 mb-6"></div>
            <h3 className="text-4xl font-bold mb-2">Mengenal orang-orang di balik SkillNusa</h3>
          </div>
          <div className="flex items-center">
            <p className="text-gray-600 italic">
              SkillNusa didirikan oleh sekelompok profesional yang memiliki latar belakang di bidang teknologi, bisnis, dan desain. Kami memahami tantangan yang dihadapi oleh freelancer dan bisnis dalam ekosistem digital Indonesia.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              name: "JEFFREY BROWN", 
              role: "Creative Leader", 
              image: "https://picsum.photos/seed/ceo/300/300",
              socials: ["f", "ig", "in"]
            },
            { 
              name: "ANN RICHMOND", 
              role: "Web Developer", 
              image: "https://picsum.photos/seed/cto/300/300",
              socials: ["f", "ig", "in"]
            },
            { 
              name: "ALEX GREENFIELD", 
              role: "Programming Guru", 
              image: "https://picsum.photos/seed/coo/300/300",
              socials: ["f", "ig", "in"]
            }
          ].map((member, index) => (
            <div key={index}>
              <div className="max-w-[300px] mx-auto">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full aspect-square object-cover mb-4"
                />
                <h3 className="font-bold text-lg mb-1">{member.name}</h3>
                <p className="text-blue-600 text-sm mb-3">{member.role}</p>
                <div className="flex gap-4">
                  {member.socials.map((social, idx) => (
                    <a 
                      key={idx} 
                      href="#" 
                      className="text-gray-600 hover:text-blue-600"
                    >
                      {social === "f" && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                        </svg>
                      )}
                      {social === "ig" && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      )}
                      {social === "in" && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageContainer>

      {/* Cara Kerja SkillNusa Section */}
      <div className="bg-gray-50">
        <PageContainer maxWidth="max-w-7xl" padding="px-4 py-16">
          <h2 className="text-4xl font-bold text-[#010042] mb-6">Cara Kerja SkillNusa</h2>
          <p className="text-gray-700 text-lg mb-6">
            Platform kami memudahkan Anda untuk terhubung dengan profesional terampil atau menemukan klien untuk layanan Anda.
          </p>

          <div className="flex items-center justify-between relative mt-12">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gray-200"></div>
            
            <div className="relative bg-gray-50 px-8 py-6 flex-1 max-w-[350px]">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Cari Layanan</h3>
                <p className="text-base text-gray-600">
                  Jelajahi berbagai kategori untuk menemukan freelancer yang tepat untuk kebutuhan proyek Anda.
                </p>
              </div>
            </div>

            <div className="relative bg-gray-50 px-8 py-6 flex-1 max-w-[350px]">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Terhubung & Kolaborasi</h3>
                <p className="text-base text-gray-600">
                  Komunikasi dengan freelancer, diskusikan detail proyek, dan setujui kelengkapan.
                </p>
              </div>
            </div>

            <div className="relative bg-gray-50 px-8 py-6 flex-1 max-w-[350px]">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-xl flex items-center justify-center bg-[#010042] bg-opacity-10 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Dapatkan Pekerjaan</h3>
                <p className="text-base text-gray-600">
                  Bayar dengan aman dan dapatkan pekerjaan berkualitas dari freelancer Indonesia terampil.
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Visi Ke Depan Section */}
      <div className="bg-white py-20">
        <PageContainer maxWidth="max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-6xl font-bold mb-6">VISI KE DEPAN</h2>
              <div className="text-gray-600 space-y-4 mb-8">
                <p>
                  Kami memiliki visi untuk menjadikan SkillNusa sebagai platform freelance terdepan di Indonesia dan Asia Tenggara. Kami ingin menciptakan ribuan peluang bagi talenta Indonesia dan membantu bisnis menemukan solusi terbaik untuk kebutuhan mereka.
                </p>
                <p>
                  Dengan terus berinovasi dan meningkatkan layanan kami, kami berharap dapat berkontribusi pada perkembangan ekonomi digital Indonesia dan membantu meningkatkan taraf hidup masyarakat melalui peluang kerja digital.
                </p>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative w-full h-auto rounded-3xl shadow-lg overflow-hidden">
              <img
                src="/images/indonesia.jpg"
                alt="Vision of Indonesia's digital future"
                className="w-full aspect-[4/3] object-cover"
              />
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
} 