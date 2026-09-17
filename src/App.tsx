import React, { useState } from 'react';
import { generateMetaStealthKeypair, deriveStealthAddress, ANCHOR_STEALTH_CONTRACT } from './services/stealthCrypto';
import { StealthMetaKey, StealthPayment } from './types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import confetti from 'canvas-confetti';
import {
  Shield, EyeOff, Lock, Key, Send, RefreshCw, CheckCircle2,
  Copy, Terminal, ExternalLink, Zap, Layers, Sparkles, ArrowRight,
  Download, Eye, AlertTriangle, ShieldCheck, DollarSign, BarChart3
} from 'lucide-react';

const PRIVACY_CHART_DATA = [
  { epoch: 'Slot 100k', anonymitySet: 120, shieldedTvl: 45000 },
  { epoch: 'Slot 150k', anonymitySet: 380, shieldedTvl: 180000 },
  { epoch: 'Slot 200k', anonymitySet: 890, shieldedTvl: 520000 },
  { epoch: 'Slot 250k', anonymitySet: 1650, shieldedTvl: 1200000 },
  { epoch: 'Slot 300k', anonymitySet: 3200, shieldedTvl: 2850000 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'send' | 'scan' | 'pools' | 'contract'>('send');
  const [userMetaKey, setUserMetaKey] = useState<StealthMetaKey>(generateMetaStealthKeypair());
  const [receiverMeta, setReceiverMeta] = useState<StealthMetaKey>(generateMetaStealthKeypair());
  const [sendAmount, setSendAmount] = useState<number>(5.0);
  const [sendToken, setSendToken] = useState<'SOL' | 'USDC' | 'sUSD'>('SOL');
  const [isSending, setIsSending] = useState(false);
  const [lastPayment, setLastPayment] = useState<StealthPayment | null>(null);

  // Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [scannedPayments, setScannedPayments] = useState<StealthPayment[]>([
    {
      id: 'pay-init-1',
      ephemeralPubkey: '9uK4v...xP21',
      stealthAddress: '4tX9L...mQ72',
      amount: 150,
      token: 'USDC',
      timestamp: '15 mins ago',
      isClaimed: false,
      viewTag: '0x3F',
      txHash: '5Kn8Yv...3q9LmX'
    },
    {
      id: 'pay-init-2',
      ephemeralPubkey: '3rV7m...wB90',
      stealthAddress: '8yP2k...zL44',
      amount: 2.5,
      token: 'SOL',
      timestamp: '1 hour ago',
      isClaimed: true,
      viewTag: '0x8A',
      txHash: '7Rt2Wx...1p8YnZ'
    }
  ]);

  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedMeta, setCopiedMeta] = useState(false);

  const handleGenerateNewKey = () => {
    setUserMetaKey(generateMetaStealthKeypair());
  };

  const handleGenerateRecipient = () => {
    setReceiverMeta(generateMetaStealthKeypair());
  };

  const handleSendStealthPayment = async () => {
    setIsSending(true);
    await new Promise(r => setTimeout(r, 900));
    const p = deriveStealthAddress(receiverMeta, sendAmount, sendToken);
    setLastPayment(p);
    setScannedPayments(prev => [p, ...prev]);
    setIsSending(false);
    confetti({ particleCount: 70, spread: 70, origin: { y: 0.65 } });
  };

  const handleScanBlockchain = async () => {
    setIsScanning(true);
    await new Promise(r => setTimeout(r, 800));
    setIsScanning(false);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  const handleSweepPayment = (id: string) => {
    setScannedPayments(prev => prev.map(p => p.id === id ? { ...p, isClaimed: true } : p));
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 } });
  };

  const copyMetaAddress = () => {
    navigator.clipboard.writeText(userMetaKey.formattedMetaAddress);
    setCopiedMeta(true);
    setTimeout(() => setCopiedMeta(false), 2000);
  };

  const copyContractCode = () => {
    navigator.clipboard.writeText(ANCHOR_STEALTH_CONTRACT);
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-zinc-100 selection:bg-emerald-500/30">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-purple-950/40 border-b border-emerald-500/20 px-4 py-2 text-center text-xs text-emerald-300 flex items-center justify-center space-x-2">
        <Shield className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-semibold">Common S3nse Hackathon — Solana Privacy & Security Track</span>
        <span className="text-zinc-400">·</span>
        <span className="text-zinc-300">Zero-Knowledge Stealth Address Protocol ($2,000 USDG Prize Pool)</span>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#090D16]/90 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-[#090D16] rounded-[10px] flex items-center justify-center">
                <Lock className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base text-white tracking-tight">StealthShield</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                  SOLANA ZK
                </span>
              </div>
              <p className="text-[9px] text-zinc-400 font-mono">ON-CHAIN STEALTH ADDRESSES & CONFIDENTIAL ROUTING</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('send')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'send' ? 'bg-emerald-500 text-black shadow-md font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Stealth</span>
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'scan' ? 'bg-cyan-500 text-black shadow-md font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Scanner & Sweep</span>
            </button>
            <button
              onClick={() => setActiveTab('pools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'pools' ? 'bg-purple-500 text-white shadow-md font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Privacy Pools</span>
            </button>
            <button
              onClick={() => setActiveTab('contract')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'contract' ? 'bg-amber-500 text-black shadow-md font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Anchor Program</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Your Meta-Stealth Key Bar */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Key className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Your Reusable Public Meta-Stealth Address</span>
              <p className="text-xs font-mono text-emerald-400 font-bold mt-0.5">{userMetaKey.formattedMetaAddress}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyMetaAddress}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 flex items-center space-x-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedMeta ? 'Copied!' : 'Copy Meta-Address'}</span>
            </button>
            <button
              onClick={handleGenerateNewKey}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Keypair</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: SEND STEALTH PAYMENT */}
        {/* ========================================================================= */}
        {activeTab === 'send' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Form */}
            <div className="lg:col-span-6 bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-6">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase">Non-Custodial ZK Transfer</span>
                <h3 className="text-xl font-black text-white mt-1">Send Unlinkable Stealth Payment</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Derives a fresh, one-time on-chain address for the recipient. No public observer can link this transaction to the recipient's real wallet.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase block mb-1.5">Recipient Meta-Stealth Address</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={receiverMeta.formattedMetaAddress}
                      readOnly
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                    />
                    <button
                      onClick={handleGenerateRecipient}
                      className="shrink-0 bg-zinc-900 hover:bg-emerald-900/40 border border-zinc-700 rounded-xl px-3 text-xs text-emerald-300 transition-colors"
                      title="Generate new recipient stealth keypair"
                    >
                      New
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase block mb-1.5">Amount</label>
                    <input
                      type="number"
                      value={sendAmount}
                      onChange={e => setSendAmount(+e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-mono focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 font-mono uppercase block mb-1.5">Asset</label>
                    <select
                      value={sendToken}
                      onChange={e => setSendToken(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white font-semibold cursor-pointer focus:border-emerald-500 outline-none"
                    >
                      <option value="SOL">SOL (Native)</option>
                      <option value="USDC">USDC (SPL Token)</option>
                      <option value="sUSD">sUSD (Token-2022 Confidential)</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSendStealthPayment}
                disabled={isSending}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-extrabold text-sm flex items-center justify-center space-x-2 hover:scale-[1.01] transition-transform cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deriving Curve25519 Stealth Address...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Broadcast Shielded Transaction</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Cryptographic Derivation Trace */}
            <div className="lg:col-span-6 bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center space-x-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>On-Chain Cryptographic Derivation</span>
              </span>

              {lastPayment ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-1">
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">1. Generated Ephemeral Keypair (r, R)</span>
                    <p className="text-xs font-mono text-white truncate">{lastPayment.ephemeralPubkey}</p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-cyan-500/30 space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">2. One-Time Stealth Destination Address</span>
                    <p className="text-xs font-mono text-white truncate">{lastPayment.stealthAddress}</p>
                    <p className="text-[10px] text-zinc-400">P_stealth = K_spend + H(r * K_view) · G</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">1-Byte View Tag</span>
                      <p className="text-xs font-mono text-white font-bold mt-0.5">{lastPayment.viewTag}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Amount Shielded</span>
                      <p className="text-xs font-mono text-white font-bold mt-0.5">{lastPayment.amount} {lastPayment.token}</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400">Solana Slot Confirmation:</span>
                    <span className="text-white font-bold">{lastPayment.txHash}</span>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center border border-dashed border-zinc-800 rounded-2xl text-zinc-500 text-xs">
                  Send a shielded transaction to view on-chain ephemeral key generation and Diffie-Hellman derivation steps.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SCANNER & SWEEP */}
        {/* ========================================================================= */}
        {activeTab === 'scan' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 font-mono uppercase">Private View-Key Scanner</span>
                <h3 className="text-lg font-black text-white mt-0.5">Detect & Sweep Incoming Stealth Payments</h3>
                <p className="text-xs text-zinc-400">Uses your private viewing key to fast-scan announcements without exposing spending keys.</p>
              </div>
              <button
                onClick={handleScanBlockchain}
                disabled={isScanning}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 text-black font-extrabold text-xs flex items-center space-x-2 hover:scale-105 transition-transform cursor-pointer shadow-lg shadow-cyan-500/20"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning Solana Slots...' : 'Scan Blockchain'}</span>
              </button>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Detected Stealth Balances ({scannedPayments.length})
              </span>

              <div className="space-y-3">
                {scannedPayments.map(pay => (
                  <div key={pay.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-black text-white font-mono">{pay.amount} {pay.token}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Tag: {pay.viewTag}</span>
                        {pay.isClaimed ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-500">SWEPT</span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">UNCLAIMED</span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-zinc-400 truncate max-w-md">Stealth Address: {pay.stealthAddress}</p>
                    </div>

                    {!pay.isClaimed ? (
                      <button
                        onClick={() => handleSweepPayment(pay.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center space-x-1.5 cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/20"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Sweep to Clean Wallet</span>
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-500 font-mono flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Swept to Cold Storage</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PRIVACY POOLS & ANONYMITY SET */}
        {/* ========================================================================= */}
        {activeTab === 'pools' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-zinc-900/70 border border-emerald-500/30 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase">Total Shielded Volume</span>
                <p className="text-2xl font-black text-white">$2,850,000</p>
                <p className="text-[10px] text-zinc-400">Across SOL, USDC, and Token-2022 assets</p>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-900/70 border border-cyan-500/30 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400 font-mono uppercase">Active Anonymity Set</span>
                <p className="text-2xl font-black text-white">3,200 Addresses</p>
                <p className="text-[10px] text-zinc-400">Zero-Knowledge mixing security threshold</p>
              </div>
              <div className="p-6 rounded-3xl bg-zinc-900/70 border border-purple-500/30 space-y-1">
                <span className="text-[10px] font-bold text-purple-400 font-mono uppercase">Avg ZK Proof Latency</span>
                <p className="text-2xl font-black text-white">18 ms</p>
                <p className="text-[10px] text-zinc-400">Client-side WASM Groth16 prover</p>
              </div>
            </div>

            <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Anonymity Set Growth & Shielded TVL Trajectory
              </span>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PRIVACY_CHART_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="epoch" tick={{ fill: '#71717A', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#71717A', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #3F3F46', borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="shieldedTvl" name="Shielded TVL ($)" stroke="#10B981" fill="#10B981" fillOpacity={0.2} />
                    <Area type="monotone" dataKey="anonymitySet" name="Anonymity Set Size" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SMART CONTRACT CODE */}
        {/* ========================================================================= */}
        {activeTab === 'contract' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 font-mono uppercase">Anchor Smart Contract</span>
                  <h3 className="text-xl font-black text-white mt-1">programs/solana_stealth_shield/src/lib.rs</h3>
                </div>
                <button
                  onClick={copyContractCode}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-200 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedContract ? 'Copied!' : 'Copy Rust Code'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-[500px] leading-relaxed">
                {ANCHOR_STEALTH_CONTRACT}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#070A11] mt-16 py-8 text-center text-xs text-zinc-500">
        <p className="font-semibold text-zinc-400">Solana StealthShield Protocol — Zero-Knowledge Stealth Addresses</p>
        <p className="font-mono mt-1 text-[10px] text-zinc-600">Built for Common S3nse Hackathon (Solana Privacy & Security Track) · $2,000 USDG Prize Pool</p>
      </footer>
    </div>
  );
}
