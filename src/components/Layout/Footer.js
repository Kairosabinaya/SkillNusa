import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white relative z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div>
            <h3 className="text-lg font-semibold text-[#010042] mb-4">Tentang SkillNusa</h3>
            <p className="text-sm text-gray-600 mb-4">
              SkillNusa adalah marketplace freelance Indonesia yang menghubungkan profesional terampil dengan klien yang mencari layanan berkualitas.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#010042] mb-4">Kontak</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600">
                <a href="mailto:support@skillnusa.com" className="hover:text-[#010042] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  support@skillnusa.com
                </a>
              </li>
              <li className="text-sm text-gray-600">
                <a href="tel:+6281294169196" className="hover:text-[#010042] transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2 text-[#010042]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +6281294169196
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[#010042] mb-4">Dapatkan Update</h3>
            <p className="text-sm text-gray-600 mb-4">Berlangganan untuk mendapatkan info terbaru tentang layanan dan fitur baru.</p>
            <form className="flex gap-2" onSubmit={(e) => {
              e.preventDefault();
              const email = e.target.email.value;
              if (email) {
                const subject = 'Berlangganan Newsletter SkillNusa';
                const body = `Halo tim SkillNusa,\n\nSaya ingin berlangganan newsletter untuk mendapatkan update terbaru.\n\nEmail saya: ${email}\n\nTerima kasih.`;
                window.location.href = `mailto:support@skillnusa.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
              }
            }}>
              <input name="email" type="email" placeholder="Masukkan email Anda" className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-transparent" required />
              <button type="submit" className="px-4 py-2 text-sm text-white bg-[#010042] rounded-lg hover:bg-opacity-90 transition-colors">
                Langganan
              </button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100">
          <div className="text-center transform transition-all duration-300 hover:-translate-y-1">
            <p className="text-sm font-medium text-gray-500 hover:text-gray-600 transition-colors duration-200">
              {new Date().getFullYear()} SkillNusa. Hak Cipta Dilindungi.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}