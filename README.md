# SkillNusa - Freelance Platform

Platform freelance modern yang menghubungkan klien dengan freelancer terbaik di Indonesia.

## 🚀 Tech Stack

- **Frontend**: React 18 + Tailwind CSS
- **Authentication & Database**: Firebase (Firestore)
- **Image Storage**: Cloudinary
- **Routing**: React Router v6
- **Form Handling**: Formik + Yup
- **UI Components**: Headless UI + Heroicons

## 📋 Prerequisites

- Node.js (v16 atau lebih baru)
- npm atau yarn
- Akun Firebase (gratis)
- Akun Cloudinary (gratis)

## ⚙️ Setup & Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd skillnusa
npm install
```

### 2. Environment Setup

1. Copy file `env.example` menjadi `.env.local`
2. Ikuti panduan lengkap di [SETUP_GUIDE.md](./SETUP_GUIDE.md) untuk:
   - Setup Firebase Authentication & Firestore
   - Setup Cloudinary untuk image storage
   - Konfigurasi environment variables

### 3. Start Development Server

```bash
npm start
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Auth/           # Authentication components
│   ├── UI/             # General UI components
│   └── common/         # Common components
├── context/            # React Context providers
├── firebase/           # Firebase configuration
├── pages/              # Page components
├── services/           # API services & business logic
├── utils/              # Utility functions
└── validation/         # Form validation schemas
```

## 🔧 Key Features

- ✅ **Authentication**: Email/password dengan Firebase Auth
- ✅ **Multi-role System**: Client dan Freelancer dalam satu akun
- ✅ **Profile Management**: Upload foto dengan Cloudinary
- ✅ **Responsive Design**: Mobile-first dengan Tailwind CSS
- ✅ **Form Validation**: Comprehensive validation dengan Yup
- ✅ **Real-time Database**: Firestore untuk data persistence

## 🔐 Security

- Firebase Security Rules untuk data protection
- Environment variables untuk sensitive data
- Input validation dan sanitization
- Secure image upload dengan Cloudinary

## 📚 Documentation

- [Setup Guide](./SETUP_GUIDE.md) - Panduan lengkap setup Firebase & Cloudinary
- [Environment Variables](./env.example) - Template environment variables

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
