import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, you would send this data to your backend
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Hubungi Kami</h1>
          <p className="text-xl text-gray-600">Kami senang mendengar dari Anda. Isi formulir di bawah ini dan kami akan segera menghubungi Anda.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            {submitted ? (
              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="text-lg font-medium text-green-800">Pesan berhasil dikirim!</h3>
                </div>
                <p className="text-green-700">Terima kasih telah menghubungi kami. Kami akan segera menghubungi Anda.</p>
                <button 
                  onClick={() => {
                    setFormData({
                      name: '',
                      email: '',
                      subject: '',
                      message: ''
                    });
                    setSubmitted(false);
                  }}
                  className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Kirim pesan lainnya
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Kirim Pesan</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-[#010042] transition-colors"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Masukkan nama lengkap Anda"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-[#010042] transition-colors"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contoh@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subjek</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-[#010042] transition-colors"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Topik pesan Anda"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Pesan</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#010042] focus:border-[#010042] transition-colors resize-vertical"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tulis pesan Anda di sini..."
                    ></textarea>
                  </div>

                  <div>
                    <button
                      type="submit"
                      className="w-full flex justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042] transition-colors"
                    >
                      Kirim Pesan
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Informasi Kontak</h3>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#010042] mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-600">support@skillnusa.com</p>
                    <p className="text-gray-600">business@skillnusa.com</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#010042] mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-1">Telepon</h4>
                    <p className="text-gray-600">+62 21 1234 5678</p>
                    <p className="text-sm text-gray-500">Senin - Jumat, 9:00 - 17:00</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#010042] mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-1">Kantor</h4>
                    <p className="text-gray-600">Jl. Sudirman No. 123</p>
                    <p className="text-gray-600">Jakarta Selatan, 12910</p>
                    <p className="text-gray-600">Indonesia</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#010042] mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-1">Jam Kerja</h4>
                    <p className="text-gray-600">Senin - Jumat: 9:00 - 17:00</p>
                    <p className="text-gray-600">Sabtu: 9:00 - 13:00</p>
                    <p className="text-gray-600">Minggu: Tutup</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="mt-8 bg-[#010042]/5 p-6 rounded-xl">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Respon Cepat</h4>
              <p className="text-sm text-gray-600 mb-4">
                Kami berkomitmen untuk merespons setiap pesan dalam waktu 24 jam pada hari kerja. 
                Untuk pertanyaan urgent, silakan hubungi langsung melalui telepon.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Dukungan Teknis
                </span>
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Konsultasi Bisnis
                </span>
                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                  Kemitraan
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 