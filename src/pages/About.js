import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center text-[#010042] mb-12">Tentang SkillNusa</h1>
          
          <div className="bg-white rounded-xl shadow-md p-8 md:p-10 mb-10">
            <h2 className="text-2xl font-semibold text-[#010042] mb-6">Misi Kami</h2>
            <p className="text-gray-700 mb-6">
              SkillNusa didirikan dengan misi untuk menghubungkan talenta-talenta terbaik Indonesia dengan bisnis dan individu yang membutuhkan jasa mereka. Kami percaya bahwa Indonesia memiliki sumber daya manusia yang luar biasa dengan berbagai keahlian, dan kami ingin memberikan platform yang memudahkan mereka untuk memonetisasi keahlian tersebut.
            </p>
            <p className="text-gray-700 mb-6">
              Melalui SkillNusa, kami berkomitmen untuk:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-2">
              <li>Membantu freelancer Indonesia mendapatkan pekerjaan yang layak dengan kompensasi yang adil</li>
              <li>Membantu bisnis menemukan talenta terbaik untuk kebutuhan mereka</li>
              <li>Menciptakan ekosistem freelance yang transparan, aman, dan profesional</li>
              <li>Mendorong perkembangan ekonomi digital Indonesia</li>
            </ul>
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
  );
} 