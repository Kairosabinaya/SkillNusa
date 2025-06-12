import { useState } from 'react';
import PageContainer from '../components/common/PageContainer';

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
    
    // Create email body with form data
    const emailBody = `
Nama: ${formData.name}
Email: ${formData.email}
Subjek: ${formData.subject}

Pesan:
${formData.message}
    `.trim();
    
    // Create mailto link with all form data
    const mailtoLink = `mailto:support@skillnusa.com?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(emailBody)}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    // Show success message
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageContainer maxWidth="max-w-4xl" padding="px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Hubungi Kami</h1>
          <p className="text-gray-600 text-sm sm:text-base">Kami senang mendengar dari Anda. Isi formulir di bawah ini dan kami akan segera menghubungi Anda.</p>
        </div>

        <div className="bg-white rounded-lg p-4 sm:p-6 lg:p-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            {submitted ? (
              <div className="bg-green-50 p-4 sm:p-6 rounded-xl border border-green-200">
                <div className="flex items-center mb-3 sm:mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <h3 className="text-base sm:text-lg font-medium text-green-800">Pesan berhasil dikirim!</h3>
                </div>
                <p className="text-sm sm:text-base text-green-700">Terima kasih telah menghubungi kami. Kami akan segera menghubungi Anda.</p>
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
                  className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm sm:text-base"
                >
                  Kirim pesan lainnya
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm sm:text-base"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm sm:text-base"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Subjek</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm sm:text-base"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">Pesan</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#010042] focus:border-[#010042] text-sm sm:text-base"
                    value={formData.message}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 sm:py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#010042] hover:bg-[#0100a3] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#010042]"
                  >
                    Kirim Pesan
                  </button>
                </div>
              </form>
            )}
          </div>

                      <div>
              <div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Informasi Kontak</h3>
              <div className="space-y-4 sm:space-y-6">
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#010042] mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900">Email</h4>
                    <a href="mailto:support@skillnusa.com" className="text-sm sm:text-base text-gray-600 hover:text-[#010042] transition-colors">
                      support@skillnusa.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#010042] mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900">Telepon</h4>
                    <a href="tel:+6281294169196" className="text-sm sm:text-base text-gray-600 hover:text-[#010042] transition-colors">
                      +6281294169196
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6 text-[#010042] mt-1 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm sm:text-base font-medium text-gray-900">Jam Kerja</h4>
                    <p className="text-sm sm:text-base text-gray-600">Senin - Jumat: 9am - 5pm</p>
                    <p className="text-sm sm:text-base text-gray-600">Sabtu: 9am - 1pm</p>
                    <p className="text-sm sm:text-base text-gray-600">Minggu: Tutup</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </PageContainer>
    </div>
  );
} 