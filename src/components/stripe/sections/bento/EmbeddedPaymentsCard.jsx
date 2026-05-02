import React from "react";

export default function EmbeddedPaymentsCard() {
  return (
    <div className="lg:col-span-3 overflow-hidden group min-h-[500px] md:min-h-[550px] cursor-pointer flex flex-col md:flex-row bg-white border border-gray-200/60 rounded-3xl relative shadow-sm" data-aura-component-name="BentoGrid">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-purple-50/50 z-0 pointer-events-none" data-aura-component-name="BentoGrid" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[300px] bg-pink-400/20 blur-[80px] rounded-full z-0 pointer-events-none" data-aura-component-name="BentoGrid" />
      <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[500px] bg-purple-500/20 blur-[80px] rounded-full z-0 pointer-events-none" data-aura-component-name="BentoGrid" />
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-3xl" data-aura-component-name="BentoGrid">
        <svg className="absolute inset-0 w-full h-full opacity-[0.18]" viewBox="0 0 1200 600" fill="none" preserveAspectRatio="none" data-aura-component-name="BentoGrid">
          <defs>
            <pattern id="embed-lines-pink" x={0} y={0} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(50)" data-aura-component-name="BentoGrid">
              <line x1={0} y1={0} x2={0} y2={14} stroke="#f9a8d4" strokeWidth={2} data-aura-component-name="BentoGrid" />
            </pattern>
            <pattern id="embed-lines-purple" x={0} y={0} width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(50)" data-aura-component-name="BentoGrid">
              <line x1={0} y1={0} x2={0} y2={14} stroke="#a78bfa" strokeWidth={2} data-aura-component-name="BentoGrid" />
            </pattern>
            <linearGradient id="embed-fade-left" x1={0} y1={0} x2={1} y2={0} data-aura-component-name="BentoGrid">
              <stop offset="0%" stopColor="white" stopOpacity={0} data-aura-component-name="BentoGrid" />
              <stop offset="45%" stopColor="white" stopOpacity={1} data-aura-component-name="BentoGrid" />
              <stop offset="100%" stopColor="white" stopOpacity={1} data-aura-component-name="BentoGrid" />
            </linearGradient>
            <linearGradient id="embed-fade-right" x1={0} y1={0} x2={1} y2={0} data-aura-component-name="BentoGrid">
              <stop offset="0%" stopColor="white" stopOpacity={1} data-aura-component-name="BentoGrid" />
              <stop offset="55%" stopColor="white" stopOpacity={1} data-aura-component-name="BentoGrid" />
              <stop offset="100%" stopColor="white" stopOpacity={0} data-aura-component-name="BentoGrid" />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={420} height={600} fill="url(#embed-lines-pink)" data-aura-component-name="BentoGrid" />
          <rect x={780} y={0} width={420} height={600} fill="url(#embed-lines-purple)" data-aura-component-name="BentoGrid" />
          <rect x={0} y={0} width={420} height={600} fill="url(#embed-fade-left)" data-aura-component-name="BentoGrid" />
          <rect x={780} y={0} width={420} height={600} fill="url(#embed-fade-right)" data-aura-component-name="BentoGrid" />
        </svg>
      </div>
      <div className="relative z-10 w-full md:w-[28%] p-6 md:p-8 flex items-start" data-aura-component-name="BentoGrid">
        <div>
          <h3 className="text-[22px] md:text-[28px] font-medium tracking-tight text-gray-900 leading-[1.05] max-w-[240px]" data-aura-component-name="BentoGrid">
            Embed payments
            <br /><br />
            in your platform
          </h3>
        </div>
      </div>
      <div className="relative z-10 flex-1 min-h-[420px] md:min-h-[550px] p-4 md:p-5" data-aura-component-name="BentoGrid">
        <div className="absolute right-4 md:right-6 top-4 md:top-5 w-[78%] h-[78%] bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.08)] overflow-hidden" data-aura-component-name="BentoGrid">
          <div className="h-10 border-b border-gray-100 flex items-center px-4 bg-gray-50/70" data-aura-component-name="BentoGrid">
            <div className="flex gap-2 mr-4" data-aura-component-name="BentoGrid">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" data-aura-component-name="BentoGrid" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" data-aura-component-name="BentoGrid" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" data-aura-component-name="BentoGrid" />
            </div>
            <div className="mx-auto text-xs text-gray-500 font-medium bg-white border border-gray-100 rounded-full px-4 py-1 min-w-[220px] text-center" data-aura-component-name="BentoGrid">
              <span className="inline-flex items-center gap-1.5" data-aura-component-name="BentoGrid">
                <iconify-icon icon="lucide:lock" width={12} data-aura-component-name="BentoGrid" />
                dashboard.zenflow.com
              </span>
            </div>
            <div className="w-10" data-aura-component-name="BentoGrid" />
          </div>
          <div className="grid grid-cols-[180px_1fr] h-[calc(100%-40px)]" data-aura-component-name="BentoGrid">
            <div className="border-r border-gray-100 bg-white/80 p-4" data-aura-component-name="BentoGrid">
              <div className="flex items-center gap-2 mb-6" data-aura-component-name="BentoGrid">
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-500" data-aura-component-name="BentoGrid">
                  <iconify-icon icon="lucide:flower-2" width={16} data-aura-component-name="BentoGrid" />
                </div>
                <span className="font-medium text-gray-900" data-aura-component-name="BentoGrid">
                  Zenflow
                </span>
              </div>
              <div className="space-y-3 text-sm text-gray-500" data-aura-component-name="BentoGrid">
                <div className="h-3 w-24 bg-gray-100 rounded-full" data-aura-component-name="BentoGrid" />
                <div className="h-3 w-20 bg-gray-100 rounded-full" data-aura-component-name="BentoGrid" />
                <div className="h-3 w-16 bg-gray-100 rounded-full" data-aura-component-name="BentoGrid" />
              </div>
            </div>
            <div className="p-5" data-aura-component-name="BentoGrid">
              <h4 className="text-[16px] md:text-[18px] font-medium text-gray-900 mb-5" data-aura-component-name="BentoGrid">
                Connected Accounts
              </h4>
              <div className="grid grid-cols-4 text-[11px] md:text-xs text-gray-500 font-medium border-b border-gray-100 pb-3 mb-2" data-aura-component-name="BentoGrid">
                <div>
                  Accounts
                </div>
                <div>
                  Account country
                </div>
                <div>
                  Payment balance (CAD)
                </div>
                <div>
                  Volume (USD)
                </div>
              </div>
              <div className="space-y-1.5 text-[11px] md:text-sm" data-aura-component-name="BentoGrid">
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-stone-100" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Vital Flow
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    Canada
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$11,270.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$96,610.02
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-indigo-500" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Daybreak Yoga
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    United States
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$2,028.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$11,989.00
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-amber-400" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Sacred Space
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    UK
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$1,683.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$33,168.27
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-orange-500" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Jackson Hot Yoga
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    Australia
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$4,940.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$17,068.46
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-gradient-to-br from-pink-400 to-orange-300" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Harmony Flow
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    United States
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$41,760.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$397,804.03
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-indigo-400" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Balance at Brunch
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    Canada
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$452.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$4,927.99
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-gray-300" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Breathline Studio
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    United States
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$3,031.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$11,621.00
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-orange-200" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Quiet Fire Yoga
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    UK
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$524.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$2,117.97
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-orange-500" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      Zenith Zen
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    Australia
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$891.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$2,218.46
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center py-2.5 border-b border-gray-100/80 text-gray-700" data-aura-component-name="BentoGrid">
                  <div className="flex items-center gap-2 font-medium text-gray-800 min-w-0" data-aura-component-name="BentoGrid">
                    <div className="w-4 h-4 rounded-full shrink-0 bg-amber-400" data-aura-component-name="BentoGrid" />
                    <span className="truncate" data-aura-component-name="BentoGrid">
                      M.E. Yoga
                    </span>
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    Canada
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$5,972.00
                  </div>
                  <div className="text-gray-500" data-aura-component-name="BentoGrid">
                    CA$9,057.96
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute left-[6%] top-[18%] w-[290px] md:w-[320px] bg-white rounded-2xl border border-gray-200 shadow-[0_18px_50px_rgba(0,0,0,0.08)] overflow-hidden" data-aura-component-name="BentoGrid">
          <div className="p-5 border-b border-gray-100" data-aura-component-name="BentoGrid">
            <div className="flex items-center gap-3 mb-6" data-aura-component-name="BentoGrid">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500" data-aura-component-name="BentoGrid">
                <iconify-icon icon="lucide:flame" width={16} data-aura-component-name="BentoGrid" />
              </div>
              <div className="font-medium text-gray-900" data-aura-component-name="BentoGrid">
                Quiet Fire Yoga
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed" data-aura-component-name="BentoGrid">
              Thank you!
              <br /><br />
              Your payment was successful.
            </p>
          </div>
          <div className="p-5 space-y-4 text-sm" data-aura-component-name="BentoGrid">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0" data-aura-component-name="BentoGrid">
              <span className="text-gray-500" data-aura-component-name="BentoGrid">
                Order number
              </span>
              <span className="font-medium text-gray-800" data-aura-component-name="BentoGrid">
                #194756
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0" data-aura-component-name="BentoGrid">
              <span className="text-gray-500" data-aura-component-name="BentoGrid">
                Date
              </span>
              <span className="font-medium text-gray-800" data-aura-component-name="BentoGrid">
                20 Feb
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0" data-aura-component-name="BentoGrid">
              <span className="text-gray-500" data-aura-component-name="BentoGrid">
                Payment method
              </span>
              <div className="w-7 h-5 rounded bg-green-400 flex items-center justify-center text-black" data-aura-component-name="BentoGrid">
                <iconify-icon icon="lucide:arrow-right" width={12} data-aura-component-name="BentoGrid" />
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0" data-aura-component-name="BentoGrid">
              <span className="text-gray-500" data-aura-component-name="BentoGrid">
                Your purchase
              </span>
              <span className="font-medium text-gray-800" data-aura-component-name="BentoGrid">
                £22.00
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-b-0 last:pb-0" data-aura-component-name="BentoGrid">
              <span className="text-gray-500" data-aura-component-name="BentoGrid">
                Total
              </span>
              <span className="font-medium text-gray-800" data-aura-component-name="BentoGrid">
                £22.00
              </span>
            </div>
          </div>
        </div>
        <div className="absolute left-[18%] top-[10%] flex items-center gap-2 text-xs font-medium text-gray-700" data-aura-component-name="BentoGrid">
          <span className="bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm" data-aura-component-name="BentoGrid">
            £22.00
          </span>
          <div className="w-16 h-px bg-pink-200" data-aura-component-name="BentoGrid" />
          <div className="w-2.5 h-2.5 rounded-full border-2 border-pink-300 bg-white" data-aura-component-name="BentoGrid" />
        </div>
        <div className="absolute right-6 top-6 w-10 h-10 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-indigo-600" data-aura-component-name="BentoGrid">
          <iconify-icon icon="lucide:expand" strokewidth="1.5" data-aura-component-name="BentoGrid" />
        </div>
      </div>
    </div>
    
  );
}
