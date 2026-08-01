import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, XCircle, Database, ShieldAlert, ArrowLeft, ArrowUpRight } from 'lucide-react'

export const revalidate = 0

export default async function SupabaseTestPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const pubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
  
  const urlExists = !!url
  const keyExists = !!pubKey
  const isDefaultKey = pubKey === 'your-anon-key'

  let connectionStatus: 'success' | 'warning' | 'error' = 'error'
  let message = ''
  let details = ''
  let rawResponse = ''

  if (!urlExists || !keyExists) {
    connectionStatus = 'error'
    message = 'Missing Environment Variables'
    details = 'Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your .env.local file.'
  } else if (isDefaultKey) {
    connectionStatus = 'warning'
    message = 'Default Key Detected'
    details = 'You are using a placeholder key. Replace it with your actual Supabase Publishable Key.'
  } else {
    try {
      const { data, error, status, statusText } = await supabase
        .from('todos')
        .select('*')
        .limit(1)

      rawResponse = JSON.stringify({ status, statusText, error, data }, null, 2)

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') {
          connectionStatus = 'success'
          message = 'Connection Established Successfully!'
          details = 'The Supabase client successfully authenticated and connected to your project. The database reported that the "todos" table does not exist, which is perfectly normal. Your setup is complete!'
        } else {
          connectionStatus = 'error'
          message = `API Error (${error.code || status})`
          details = error.message || 'Request to Supabase failed.'
        }
      } else {
        connectionStatus = 'success'
        message = 'Connection Success & Table Found!'
        details = 'Successfully connected to Supabase and queried the "todos" table.'
      }
    } catch (err: any) {
      connectionStatus = 'error'
      message = 'Network Error or Exception'
      details = err?.message || 'Could not contact Supabase servers. Check your network or URL.'
    }
  }

  const currentYear = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between font-sans selection:bg-purple-500/30">
      {/* Background glow effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-purple-500" />
            <span className="font-bold tracking-wider text-sm bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">GMX GAMING</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl w-full mx-auto px-6 py-12 flex-grow relative z-10">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">System Diagnostics</span>
          <h1 className="text-4xl sm:text-5xl font-bold mt-2 mb-4 tracking-tight">
            Supabase Connection
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base">
            This tool verifies your environment credentials and performs a test query to your Supabase instance.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
          
          <div className="flex flex-col sm:flex-row sm:items-start gap-6 relative z-10">
            <div className="flex-shrink-0">
              {connectionStatus === 'success' && (
                <div className="w-14 h-14 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              {connectionStatus === 'warning' && (
                <div className="w-14 h-14 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                  <AlertTriangle className="w-8 h-8" />
                </div>
              )}
              {connectionStatus === 'error' && (
                <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.2)]">
                  <XCircle className="w-8 h-8" />
                </div>
              )}
            </div>

            <div className="flex-grow">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Result</span>
              <h2 className="text-2xl font-bold mt-1 mb-2 text-white">
                {message}
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                {details}
              </p>

              {/* Steps or Info */}
              {connectionStatus === 'success' && (
                <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-200">
                  <strong>Recommended Next Step:</strong> If you need to use the <code>todos</code> table, you can create it via the Supabase SQL Editor by running:<br/>
                  <pre className="mt-3 p-3 bg-black/40 border border-white/5 rounded-lg overflow-x-auto text-[11px] font-mono text-gray-300">
                    {`create table todos (
  id bigint generated always as identity primary key,
  name text not null
);`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
          {/* Environment Variables */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl hover:bg-white/10 transition-colors">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              Environment Variables
            </h3>
            <ul className="space-y-4 text-xs">
              <li className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="font-mono text-gray-400">NEXT_PUBLIC_SUPABASE_URL</span>
                <span className={`px-2 py-1 rounded font-bold text-[10px] tracking-wider ${urlExists ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {urlExists ? 'DEFINED' : 'MISSING'}
                </span>
              </li>
              <li className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="font-mono text-gray-400">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</span>
                <span className={`px-2 py-1 rounded font-bold text-[10px] tracking-wider ${keyExists && !isDefaultKey ? 'bg-green-500/20 text-green-400 border border-green-500/30' : isDefaultKey ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                  {isDefaultKey ? 'DEFAULT' : keyExists ? 'DEFINED' : 'MISSING'}
                </span>
              </li>
            </ul>
            {urlExists && (
              <div className="mt-5 p-3 bg-black/40 rounded-lg border border-white/5 text-[11px] text-gray-400 overflow-x-auto">
                <strong>URL:</strong> <code className="font-mono text-purple-300 ml-1">{url}</code>
              </div>
            )}
          </div>

          {/* Quick Guide */}
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:bg-white/10 transition-colors">
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Guide</h3>
              <p className="text-xs text-gray-300 leading-relaxed mb-4">
                To link your database:
              </p>
              <ol className="list-decimal pl-4 text-xs space-y-3 text-gray-300 marker:text-purple-500">
                <li>Enter your Supabase project dashboard.</li>
                <li>Go to <strong>Project Settings &gt; API</strong>.</li>
                <li>Copy the <strong>Project URL</strong> and <strong>anon (public)</strong> key.</li>
                <li>Paste them into your local <code>.env.local</code>.</li>
              </ol>
            </div>
            <div className="mt-6 pt-5 border-t border-white/10">
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center gap-2 w-full bg-white text-black hover:bg-gray-200 text-xs py-3 px-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                <span>Go to Supabase Dashboard</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Raw Response Diagnostics */}
        {rawResponse && (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-xl relative z-10">
            <h3 className="text-lg font-bold mb-4">Raw API Response</h3>
            <pre className="p-4 bg-black/60 rounded-xl border border-white/5 overflow-x-auto text-[11px] font-mono text-gray-400 max-h-60 custom-scrollbar">
              {rawResponse}
            </pre>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md py-6 relative z-10">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {currentYear} GMX Gaming. Todos los derechos reservados.</p>
          <p>
            <a 
              href="https://www.kytcode.lat" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-white inline-flex items-center gap-1.5 font-semibold transition-colors"
            >
              Desarrollado por K&T <span className="text-white">❤</span>
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
