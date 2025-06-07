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
      {/* Hero Section with Enhanced Animations */}
      <div className="relative bg-gradient-to-br from-gray-50 to-[#010042]/5 pt-24 pb-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23010042' fill-opacity='0.1'%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        <PageContainer maxWidth="max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left Image Section with Enhanced Effects */}
            <div className="relative w-full h-auto rounded-3xl shadow-2xl overflow-hidden group transform transition-all duration-700 hover:scale-105 hover:shadow-3xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#010042]/20 to-[#010042]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
              <img
                src="/images/team.jpg"
                alt="Team member working"
                className="w-full aspect-[16/10] object-cover object-[50%_28%] transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-[#010042] to-[#010042]/80 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            </div>

            {/* Right Content Section with Staggered Animations */}
            <div className="flex flex-col justify-center md:pl-12 lg:pl-16 space-y-6">
              <div className="transform transition-all duration-700 hover:translate-x-2">
                <h1 className="text-6xl font-bold tracking-tight mb-8 bg-gradient-to-r from-[#010042] via-[#010042]/80 to-[#010042]/60 bg-clip-text text-transparent hover:from-[#010042]/90 hover:via-[#010042] hover:to-[#010042]/80 transition-all duration-500">
                  TENTANG KAMI
                </h1>
              </div>
              <div className="space-y-6 text-gray-600">
                <div className="transform transition-all duration-500 hover:translate-x-1 hover:text-gray-700">
                  <p className="text-lg leading-relaxed border-l-4 border-[#010042] pl-4 hover:border-[#010042]/70 transition-colors duration-300">
                    SkillNusa lahir dari visi untuk menghubungkan talenta terbaik Indonesia dengan peluang global. 
                    Kami percaya bahwa setiap individu memiliki keahlian unik yang dapat memberikan nilai tambah bagi dunia.
                  </p>
                </div>
                <div className="transform transition-all duration-500 delay-100 hover:translate-x-1 hover:text-gray-700">
                  <p className="text-lg leading-relaxed border-l-4 border-[#010042]/70 pl-4 hover:border-[#010042] transition-colors duration-300">
                    Saat ini, kami membangun marketplace yang mendemokratisasi akses ke pekerjaan freelance berkualitas, 
                    memungkinkan para profesional Indonesia untuk berkembang dan mencapai potensi penuh mereka.
                  </p>
                </div>
                <div className="transform transition-all duration-500 delay-200 hover:translate-x-1 hover:text-gray-700">
                  <p className="text-lg leading-relaxed border-l-4 border-[#010042]/50 pl-4 hover:border-[#010042]/70 transition-colors duration-300">
                    Misi kami adalah menciptakan ekosistem yang mendukung pertumbuhan ekonomi kreatif Indonesia 
                    melalui platform yang aman, transparan, dan memberikan nilai tambah bagi semua pihak.
                  </p>
                </div>
              </div>
              
              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-4 pt-8">
                <div className="text-center transform transition-all duration-500 hover:scale-110 hover:bg-[#010042]/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#010042]">1000+</div>
                  <div className="text-sm text-gray-600">Freelancer</div>
                </div>
                <div className="text-center transform transition-all duration-500 hover:scale-110 hover:bg-[#010042]/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#010042]">500+</div>
                  <div className="text-sm text-gray-600">Proyek Selesai</div>
                </div>
                <div className="text-center transform transition-all duration-500 hover:scale-110 hover:bg-[#010042]/5 rounded-lg p-4">
                  <div className="text-2xl font-bold text-[#010042]">50+</div>
                  <div className="text-sm text-gray-600">Kategori</div>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* SkillBot AI Section - New Section */}
      <div className="bg-white py-20">
        <PageContainer maxWidth="max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="transform transition-all duration-700 hover:translate-x-2">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#010042] to-[#010042]/80 rounded-2xl flex items-center justify-center mr-4 transform transition-all duration-500 hover:rotate-12 hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-4xl font-bold text-[#010042] mb-2">SkillBot</h2>
                  <p className="text-[#010042]/70 text-lg font-semibold">AI-Powered Assistant</p>
                </div>
              </div>
              
              <div className="space-y-6 text-gray-600">
                <div className="transform transition-all duration-500 hover:translate-x-2">
                  <p className="text-lg leading-relaxed border-l-4 border-[#010042] pl-6 hover:border-[#010042]/70 hover:text-gray-700 transition-all duration-300">
                    SkillBot adalah asisten AI revolusioner yang menggunakan teknologi machine learning terdepan untuk membantu Anda menemukan freelancer terbaik dengan cepat dan akurat.
                  </p>
                </div>
                <div className="transform transition-all duration-500 hover:translate-x-2 delay-100">
                  <p className="text-lg leading-relaxed border-l-4 border-[#010042]/70 pl-6 hover:border-[#010042] hover:text-gray-700 transition-all duration-300">
                    Dengan pemahaman mendalam tentang kebutuhan proyek Anda, SkillBot dapat memberikan rekomendasi personal yang disesuaikan dengan budget, timeline, dan preferensi Anda.
                  </p>
                </div>
                <div className="transform transition-all duration-500 hover:translate-x-2 delay-200">
                  <p className="text-lg leading-relaxed border-l-4 border-[#010042]/50 pl-6 hover:border-[#010042]/70 hover:text-gray-700 transition-all duration-300">
                    Teknologi AI canggih kami mampu menganalisis ribuan profil freelancer dan mencocokkannya dengan kebutuhan spesifik proyek Anda dalam hitungan detik.
                  </p>
                </div>
              </div>
            </div>

            {/* Right AI Features Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-[#010042]/5 rounded-xl p-6 transform transition-all duration-500 hover:scale-105 hover:bg-[#010042]/10 group">
                <div className="text-3xl mb-4 transform transition-all duration-500 group-hover:scale-110">
                  <svg className="w-8 h-8 text-[#010042]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    <circle cx="9" cy="9" r="1.5"/>
                    <circle cx="15" cy="9" r="1.5"/>
                    <path d="M8 13h8c0 2.21-1.79 4-4 4s-4-1.79-4-4z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[#010042] mb-2 text-lg">Smart Matching</h3>
                <p className="text-sm text-gray-600">AI mencocokkan kebutuhan dengan freelancer terbaik</p>
              </div>
              <div className="bg-[#010042]/5 rounded-xl p-6 transform transition-all duration-500 hover:scale-105 hover:bg-[#010042]/10 group">
                <div className="text-3xl mb-4 transform transition-all duration-500 group-hover:scale-110">
                  <svg className="w-8 h-8 text-[#010042]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[#010042] mb-2 text-lg">Real-time Support</h3>
                <p className="text-sm text-gray-600">Bantuan instan 24/7 dari AI assistant</p>
              </div>
              <div className="bg-[#010042]/5 rounded-xl p-6 transform transition-all duration-500 hover:scale-105 hover:bg-[#010042]/10 group">
                <div className="text-3xl mb-4 transform transition-all duration-500 group-hover:scale-110">
                  <svg className="w-8 h-8 text-[#010042]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[#010042] mb-2 text-lg">Data Analytics</h3>
                <p className="text-sm text-gray-600">Analisis mendalam untuk hasil optimal</p>
              </div>
              <div className="bg-[#010042]/5 rounded-xl p-6 transform transition-all duration-500 hover:scale-105 hover:bg-[#010042]/10 group">
                <div className="text-3xl mb-4 transform transition-all duration-500 group-hover:scale-110">
                  <svg className="w-8 h-8 text-[#010042]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </div>
                <h3 className="font-bold text-[#010042] mb-2 text-lg">Precision Match</h3>
                <p className="text-sm text-gray-600">Akurasi tinggi dalam pencocokan skill</p>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Cara Kerja SkillNusa Section with Enhanced Interactivity */}
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <PageContainer maxWidth="max-w-7xl" padding="px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-[#010042] mb-6 transform transition-all duration-500 hover:scale-105">
              Cara Kerja SkillNusa
            </h2>
            <p className="text-gray-700 text-xl mb-6 max-w-3xl mx-auto leading-relaxed">
              Platform kami memudahkan Anda untuk terhubung dengan profesional terampil atau menemukan klien untuk layanan Anda.
            </p>
          </div>

          <div className="flex items-center justify-between relative mt-12">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] bg-gradient-to-r from-[#010042]/30 via-[#010042]/50 to-[#010042]/30 rounded-full"></div>
            
            <div className="relative bg-white px-8 py-8 flex-1 max-w-[380px] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 group border border-[#010042]/10">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#010042] to-[#010042]/80 mb-6 group-hover:from-[#010042]/90 group-hover:to-[#010042] transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-[#010042] transition-colors duration-300">Cari Layanan</h3>
                <p className="text-base text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  Jelajahi berbagai kategori untuk menemukan freelancer yang tepat untuk kebutuhan proyek Anda.
                </p>
              </div>
            </div>

            <div className="relative bg-white px-8 py-8 flex-1 max-w-[380px] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 group border border-[#010042]/10">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#010042]/80 to-[#010042]/60 mb-6 group-hover:from-[#010042] group-hover:to-[#010042]/80 transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-[#010042] transition-colors duration-300">Terhubung & Kolaborasi</h3>
                <p className="text-base text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  Komunikasi dengan freelancer, diskusikan detail proyek, dan setujui kelengkapan.
                </p>
              </div>
            </div>

            <div className="relative bg-white px-8 py-8 flex-1 max-w-[380px] rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 group border border-[#010042]/10">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#010042]/60 to-[#010042]/40 mb-6 group-hover:from-[#010042]/80 group-hover:to-[#010042]/60 transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-[#010042] transition-colors duration-300">Dapatkan Pekerjaan</h3>
                <p className="text-base text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                  Bayar dengan aman dan dapatkan pekerjaan berkualitas dari freelancer Indonesia terampil.
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>

      {/* Features Section - Updated with consistent colors */}
      <div className="bg-gradient-to-br from-[#010042] to-[#010042]/90 py-20 relative overflow-hidden">
        <div className="absolute inset-0"></div>
        <PageContainer maxWidth="max-w-7xl">
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-5xl font-bold text-white mb-6 transform transition-all duration-500 hover:scale-105">
              Mengapa Memilih SkillNusa?
            </h2>
            <p className="text-white/80 text-xl max-w-3xl mx-auto">
              Kami menyediakan platform terbaik untuk menghubungkan talenta dengan peluang
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {[
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11A1,1 0 0,1 14,12H13V16H11V12H10A1,1 0 0,1 9,11V10C9,8.6 10.4,7 12,7Z"/>
                  </svg>
                ),
                title: "Keamanan Terjamin",
                desc: "Sistem pembayaran aman dengan escrow dan verifikasi identitas"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                ),
                title: "Proses Cepat",
                desc: "Matching otomatis antara client dan freelancer dalam hitungan menit"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ),
                title: "Kualitas Terbaik",
                desc: "Freelancer terverifikasi dengan portfolio dan rating terpercaya"
              },
              {
                icon: (
                  <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    <circle cx="9" cy="9" r="1.5"/>
                    <circle cx="15" cy="9" r="1.5"/>
                    <path d="M8 13h8c0 2.21-1.79 4-4 4s-4-1.79-4-4z"/>
                  </svg>
                ),
                title: "AI-Powered",
                desc: "SkillBot membantu menemukan match terbaik dengan teknologi AI"
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center transform transition-all duration-500 hover:scale-110 hover:bg-white/20 hover:shadow-2xl group border border-white/20">
                <div className="mb-4 transform transition-all duration-500 group-hover:scale-125 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white/90 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-white/80 group-hover:text-white transition-colors duration-300">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </div>

      {/* Visi Ke Depan Section with Enhanced Design */}
      <div className="bg-white py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#010042]/10 to-[#010042]/5 rounded-full -translate-y-48 translate-x-48 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#010042]/5 to-[#010042]/10 rounded-full translate-y-48 -translate-x-48 opacity-50"></div>
        
        <PageContainer maxWidth="max-w-7xl">
          <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
            {/* Left Content */}
            <div className="transform transition-all duration-700 hover:translate-x-2">
              <h2 className="text-6xl font-bold mb-8 bg-gradient-to-r from-[#010042] via-[#010042]/80 to-[#010042]/60 bg-clip-text text-transparent hover:from-[#010042]/90 hover:via-[#010042] hover:to-[#010042]/80 transition-all duration-500">
                VISI KE DEPAN
              </h2>
              <div className="text-gray-600 space-y-6 mb-8">
                <div className="transform transition-all duration-500 hover:translate-x-2">
                  <p className="text-lg leading-relaxed border-l-4 border-[#010042] pl-6 hover:border-[#010042]/70 hover:text-gray-700 transition-all duration-300">
                    Kami memiliki visi untuk menjadikan SkillNusa sebagai platform freelance terdepan di Indonesia dan Asia Tenggara. Dengan teknologi AI SkillBot, kami ingin menciptakan ribuan peluang bagi talenta Indonesia dan membantu bisnis menemukan solusi terbaik untuk kebutuhan mereka.
                  </p>
                </div>
                <div className="transform transition-all duration-500 hover:translate-x-2 delay-100">
                  <p className="text-lg leading-relaxed border-l-4 border-[#010042]/70 pl-6 hover:border-[#010042] hover:text-gray-700 transition-all duration-300">
                    Dengan terus berinovasi dan mengintegrasikan kecerdasan buatan, kami berharap dapat berkontribusi pada perkembangan ekonomi digital Indonesia dan membantu meningkatkan taraf hidup masyarakat melalui peluang kerja digital yang lebih pintar dan efisien.
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex space-x-4">
                <button
                  onClick={(e) => handleAuthRequiredClick(e, ROUTES.BROWSE)}
                  className="bg-gradient-to-r from-[#010042] to-[#010042]/80 text-white px-8 py-4 rounded-full font-semibold transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:from-[#010042]/90 hover:to-[#010042]"
                >
                  Mulai Sekarang
                </button>
                <button className="border-2 border-[#010042]/30 text-[#010042] px-8 py-4 rounded-full font-semibold transform transition-all duration-300 hover:scale-105 hover:border-[#010042] hover:bg-[#010042]/5">
                  Pelajari Lebih Lanjut
                </button>
              </div>
            </div>

            {/* Right Image */}
            <div className="relative w-full h-auto rounded-3xl shadow-2xl overflow-hidden group transform transition-all duration-700 hover:scale-105 hover:shadow-3xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#010042]/20 to-[#010042]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"></div>
              <img
                src="/images/indonesia.jpg"
                alt="Vision of Indonesia's digital future"
                className="w-full aspect-[4/3] object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute -top-4 -left-4 w-32 h-32 bg-gradient-to-br from-[#010042]/30 to-[#010042]/20 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            </div>
          </div>
        </PageContainer>
      </div>
    </div>
  );
} 