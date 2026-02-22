import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [report, setReport] = useState('');
  const [logs, setLogs] = useState([]);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [optimize, setOptimize] = useState('cost'); // 'speed' or 'cost'
  const [assessments, setAssessments] = useState({ security: true, privacy: true, utility: true });

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!url) return;

    setStatus('loading');
    setSaveStatus('idle'); // Reset the save button state for new runs!
    setLogs([]); // Clear previous logs

    // Listen to the SSE stream from the Python backend
    const eventSource = new EventSource('http://localhost:5000/stream');
    eventSource.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
    };

    try {
      const response = await fetch('http://localhost:5678/webhook/ai-risk-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          optimize: optimize,
          assessments: Object.keys(assessments).filter(k => assessments[k])
        }),
      });

      if (response.ok) {
        const textData = await response.text();
        let reportText = textData;

        // Try to parse as JSON in case n8n returned a structured object
        try {
          const data = JSON.parse(textData);
          if (data && data.report) {
            reportText = data.report;
          } else if (Array.isArray(data) && data.length > 0 && data[0].report) {
            reportText = data[0].report;
          } else if (data && data.data && data.data.report) {
            reportText = data.data.report;
          } else if (typeof data === 'string') {
            reportText = data;
          } else {
            reportText = JSON.stringify(data, null, 2);
          }
        } catch (e) {
          // If JSON parsing fails, it just means n8n returned pure plaintext.
          // We can proceed normally with the raw text string!
        }

        setReport(reportText);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error triggering assessment:', error);
      setStatus('error');
    } finally {
      eventSource.close();
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');

    try {
      const response = await fetch('http://localhost:5678/webhook/save-risk-assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url, report: report }),
      });

      if (response.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving report:', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col items-center">
      <header className="mb-12 text-center w-full">
        <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          AI Governance & Risk Assessor
        </h1>
        <p className="text-slate-400 text-lg">
          Automated evaluation of new AI products for security, privacy, and utility.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 w-full items-start justify-center">
        <main className="flex-1 w-full max-w-3xl">
          {/* Input Section */}
          <div className="bg-slate-800 rounded-2xl p-8 shadow-xl border border-slate-700 mb-8 w-full transform transition-all hover:shadow-2xl hover:border-slate-600">
            <form onSubmit={handleAnalyze} className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="url"
                  placeholder="Paste tool URL here (e.g., https://example.ai)"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                  required
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-8 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                >
                  {status === 'loading' ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Analyze Risk'
                  )}
                </button>
              </div>

              {/* Optimization Toggle */}
              <div className="flex items-center gap-4 text-sm text-slate-300">
                <span className="font-semibold text-slate-400">Optimise for:</span>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="optimize"
                    value="speed"
                    checked={optimize === 'speed'}
                    onChange={() => setOptimize('speed')}
                    className="w-4 h-4 text-blue-500 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                  />
                  <span className="group-hover:text-blue-400 transition-colors">Speed ⚡ <span className="text-slate-500 text-xs">(Gemini)</span></span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="optimize"
                    value="cost"
                    checked={optimize === 'cost'}
                    onChange={() => setOptimize('cost')}
                    className="w-4 h-4 text-blue-500 bg-slate-900 border-slate-600 focus:ring-blue-500 focus:ring-offset-slate-800"
                  />
                  <span className="group-hover:text-blue-400 transition-colors">Cost 💰 <span className="text-slate-500 text-xs">(Ollama)</span></span>
                </label>
              </div>

              {/* Assessment Selection Toggle */}
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-slate-400 text-sm">Select Assessments:</span>
                <div className="flex items-center gap-6">
                  {['security', 'privacy', 'utility'].map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={assessments[type]}
                        onChange={(e) => setAssessments({ ...assessments, [type]: e.target.checked })}
                        className="w-4 h-4 text-emerald-500 bg-slate-900 border-slate-600 rounded focus:ring-emerald-500 focus:ring-offset-slate-800 transition-all"
                      />
                      <span className="capitalize text-slate-300 group-hover:text-emerald-400 transition-colors text-sm">
                        {type}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Error State */}
          {status === 'error' && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-6 py-4 rounded-xl mb-8 w-full shadow-lg animate-fade-in-up">
              <h3 className="font-bold text-red-100 flex items-center gap-2 mb-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Analysis Failed
              </h3>
              <p className="text-sm opacity-90">There was an issue retrieving the report. Please check the n8n workflow logs or ensure the AI model is running properly.</p>
            </div>
          )}

          {/* Results - Only shows on success */}
          {status === 'success' && (
            <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 animate-fade-in-up w-full flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-700 pb-4 gap-4">
                <h2 className="text-2xl font-bold text-slate-100">Analysis Report</h2>
                <button
                  onClick={handleSave}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-6 rounded-lg transition-all focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px] text-sm"
                >
                  {saveStatus === 'idle' && 'Save to Sheets'}
                  {saveStatus === 'saving' && 'Saving...'}
                  {saveStatus === 'saved' && '✓ Saved'}
                  {saveStatus === 'error' && 'Retry Save'}
                </button>
              </div>

              {saveStatus === 'error' && (
                <div className="bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
                  Failed to save to Google Sheets. Check n8n logs and ensure the /webhook/save-risk-assessment workflow is active.
                </div>
              )}

              <div className="prose prose-invert max-w-none prose-emerald">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Agent Log */}
        <aside className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-8 h-[600px] lg:h-[calc(100vh-6rem)] min-h-[400px]">
          <div className="bg-[#0d1117] rounded-xl border border-slate-700 shadow-2xl overflow-hidden h-full flex flex-col animate-fade-in-up">
            <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <span className="text-xs font-mono text-slate-300 font-bold tracking-wider uppercase">SwarmAI Agent Activity Log</span>
              </div>
              {status === 'loading' && (
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              )}
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-sm space-y-3 flex flex-col">
              {logs.length === 0 && status !== 'loading' ? (
                <div className="text-slate-600 flex items-center justify-center h-full italic">
                  Waiting for task initialization...
                </div>
              ) : logs.length === 0 && status === 'loading' ? (
                <div className="text-slate-400 animate-pulse flex items-center gap-3 mt-2">
                  <svg className="animate-spin h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Establishing connection to agent swarm...
                </div>
              ) : (
                logs.map((log, index) => {
                  const isSystem = log.includes('DONE_SIGNAL');
                  if (isSystem) return null;

                  return (
                    <div key={index} className="text-emerald-400 opacity-90 animate-fade-in-up leading-relaxed border-b border-slate-800/50 pb-2 break-words">
                      <span className="text-emerald-600 mr-2 font-bold">&gt;</span>
                      {log}
                    </div>
                  );
                })
              )}
              <div style={{ float: "left", clear: "both" }}></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default App;
