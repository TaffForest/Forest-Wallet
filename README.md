# Forest Wallet

A modern, secure browser extension wallet for the Monad blockchain, built with React, TypeScript, and Vite.

## 🌲 Features

### **Multi-Wallet Support**
- Create and manage up to 5 wallets
- Easy switching between wallets
- Individual balance tracking for each wallet

### **Security & UX**
- **10-minute auto-lock**: Automatically locks after inactivity
- **Activity tracking**: Resets timer with any interaction
- **Encrypted storage**: Local encryption with scrypt
- **Clean interface**: Modern, intuitive design

### **Core Functionality**
- **Send MON**: Transfer tokens to any address
- **Receive MON**: QR code generation and address sharing
- **Address Book**: Save and manage frequently used addresses
- **Copy Address**: One-click address copying with visual feedback

### **Coming Soon**
- **Staking**: Forest validator staking on Monad
- **Magma MEV**: MEV integration for Forest Staking

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Chrome browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/forest-wallet.git
   cd forest-wallet
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

### Loading the Extension

1. **Open Chrome** and go to `chrome://extensions/`
2. **Enable "Developer mode"** (toggle in top right)
3. **Click "Load unpacked"**
4. **Select the `dist` folder** from your project
5. **The Forest Wallet extension should now appear**

## 🛠️ Development

### Project Structure
```
forest-wallet/
├── src/
│   ├── components/     # React components
│   ├── lib/           # Utility libraries
│   ├── keys.ts        # Wallet key management
│   ├── session.ts     # Session management
│   ├── db.ts          # Database operations
│   └── monad.ts       # Monad blockchain integration
├── public/            # Static assets
│   ├── manifest.json  # Extension manifest
│   └── icons/         # Extension icons
└── dist/              # Build output
```

### Key Technologies
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **Ethers.js**: Ethereum/Monad wallet functionality
- **IndexedDB**: Local data storage
- **Scrypt**: Password-based key derivation

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run zip` - Create extension zip file
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables
Create a `.env` file for local development:
```env
VITE_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
```

### Extension Manifest
The extension is configured in `public/manifest.json`:
- **Permissions**: Storage, scripting
- **Host permissions**: Monad testnet RPC
- **Icons**: Multiple sizes for different contexts

## 🔒 Security

### Encryption
- **Scrypt KDF**: Password-based key derivation
- **AES-GCM**: Encrypted vault storage
- **Local-only**: No data leaves the browser

### Auto-Lock
- **10-minute timeout**: Automatic locking
- **Activity tracking**: Resets on any interaction
- **Session management**: Runtime password handling

## 🎨 Design

### UI Components
- **Modern cards**: Clean, rounded design
- **Consistent spacing**: 8px grid system
- **Forest theme**: Green color palette
- **Responsive**: Works on different screen sizes

### Icons
- **Forest logo**: Custom green tree design
- **Multiple sizes**: 16px to 128px
- **Transparent background**: Clean toolbar integration

## 📦 Building

### Development Build
```bash
npm run dev
```
Access at `http://localhost:5173`

### Production Build
```bash
npm run build
```
Extension files created in `dist/` folder

### Extension Package
```bash
npm run zip
```
Creates `forest-wallet.zip` for distribution

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Monad Team**: For the blockchain infrastructure
- **Forest Staking**: For validator integration
- **Ethers.js**: For wallet functionality
- **React Team**: For the amazing framework

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Forest Wallet** - Secure, modern wallet for the Monad ecosystem 🌲
