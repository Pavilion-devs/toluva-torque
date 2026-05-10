import React from "react";

export default function UnifiedCheckoutCard() {
  return (
    <div className="lg:col-span-2 relative bg-gray-50 rounded-3xl overflow-hidden border border-gray-200/60 shadow-sm group min-h-[500px] cursor-pointer" data-aura-component-name="BentoGrid">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-pink-50" data-aura-component-name="BentoGrid" />
      <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[120%] bg-gradient-to-br from-orange-400/20 via-pink-500/20 to-purple-600/20 blur-[80px] rounded-full mix-blend-multiply group-hover:scale-110 transition-transform duration-1000 ease-out" data-aura-component-name="BentoGrid" />
      <div className="absolute inset-0 flex flex-col md:flex-row items-end justify-center gap-8 pt-12 px-8 overflow-hidden" data-aura-component-name="BentoGrid">
        <div className="w-[260px] h-[480px] bg-white rounded-[2.5rem] border-[8px] border-gray-900 shadow-2xl relative z-10 translate-y-12 group-hover:translate-y-6 transition-transform duration-700 ease-out flex-shrink-0 flex flex-col" data-aura-component-name="BentoGrid">
          <div className="flex-1 px-5 py-6 flex flex-col items-center" data-aura-component-name="BentoGrid">
            <div className="w-12 h-1.5 rounded-full bg-gray-900 mb-5" data-aura-component-name="BentoGrid" />
            <iconify-icon icon="lucide:nfc" className="text-gray-800 text-2xl mb-6" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
            <p className="text-base font-medium text-gray-500 mb-1" data-aura-component-name="BentoGrid">
              Pay to Showflix
            </p>
            <h3 className="text-3xl font-medium tracking-tight text-gray-900 mb-2" data-aura-component-name="BentoGrid">
              JP¥5,000.00
            </h3>
            <p className="text-xs text-gray-400 text-center mb-8" data-aura-component-name="BentoGrid">
              Tap, insert, or swipe to pay
            </p>
            <div className="w-full space-y-3 mb-6" data-aura-component-name="BentoGrid">
              <div className="flex justify-between text-sm" data-aura-component-name="BentoGrid">
                <span className="text-gray-500 text-base" data-aura-component-name="BentoGrid">
                  Gift card
                </span>
                <span className="font-medium text-gray-900 text-base" data-aura-component-name="BentoGrid">
                  JP¥5,000.00
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-gray-100 pt-3" data-aura-component-name="BentoGrid">
                <span className="text-gray-500 text-base" data-aura-component-name="BentoGrid">
                  Total
                </span>
                <span className="font-medium text-gray-900 text-base" data-aura-component-name="BentoGrid">
                  JP¥5,000.00
                </span>
              </div>
            </div>
            <button className="w-full py-3 bg-purple-500 text-white rounded-xl font-medium text-base mt-auto" data-aura-component-name="BentoGrid">
              Continue
            </button>
          </div>
        </div>
        <div className="w-[420px] h-[400px] bg-white/95 backdrop-blur-xl rounded-t-xl shadow-2xl relative z-10 translate-y-8 group-hover:translate-y-2 transition-transform duration-700 delay-75 ease-out flex-shrink-0 border border-white/40 hidden md:flex flex-col" data-aura-component-name="BentoGrid">
          <div className="flex items-center px-4 py-2 border-b border-gray-100 bg-gray-50/50 rounded-t-xl" data-aura-component-name="BentoGrid">
            <div className="flex gap-1.5 mr-4" data-aura-component-name="BentoGrid">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" data-aura-component-name="BentoGrid" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" data-aura-component-name="BentoGrid" />
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" data-aura-component-name="BentoGrid" />
            </div>
            <div className="flex-1 bg-white border border-gray-100 rounded flex items-center justify-center gap-1.5 py-1 text-xs text-gray-500" data-aura-component-name="BentoGrid">
              <iconify-icon icon="lucide:lock" className="text-xs" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
              showflixapp.com/checkout
            </div>
          </div>
          <div className="flex p-6 gap-6 flex-1" data-aura-component-name="BentoGrid">
            <div className="flex-1 flex flex-col" data-aura-component-name="BentoGrid">
              <h3 className="text-base font-medium tracking-tight text-gray-900 mb-4" data-aura-component-name="BentoGrid">
                SHOWFLIX
              </h3>
              <label className="block text-sm font-medium text-gray-700 mb-1" data-aura-component-name="BentoGrid">
                Email address
              </label>
              <div className="w-full border border-gray-200 rounded-md py-2 px-3 text-sm text-gray-400 mb-3" data-aura-component-name="BentoGrid">
                your@email.com
              </div>
              <div className="flex gap-2 mb-3" data-aura-component-name="BentoGrid">
                <button className="flex-1 bg-[#00d632] text-white py-2 rounded-md flex items-center justify-center gap-1 font-medium text-base" data-aura-component-name="BentoGrid">
                  <iconify-icon icon="lucide:arrow-right-circle" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
                  Link
                </button>
                <button className="flex-1 bg-black text-white py-2 rounded-md flex items-center justify-center gap-1 font-medium text-base" data-aura-component-name="BentoGrid">
                  <iconify-icon icon="lucide:apple" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
                  Pay
                </button>
              </div>
              <div className="flex items-center gap-2 mb-3" data-aura-component-name="BentoGrid">
                <div className="flex-1 border-t border-gray-200" data-aura-component-name="BentoGrid" />
                <span className="text-xs text-gray-400" data-aura-component-name="BentoGrid">
                  or
                </span>
                <div className="flex-1 border-t border-gray-200" data-aura-component-name="BentoGrid" />
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1" data-aura-component-name="BentoGrid">
                Payment method
              </label>
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white mb-2" data-aura-component-name="BentoGrid">
                <div className="p-2 border-b border-gray-200 flex items-center gap-2 bg-blue-50/30" data-aura-component-name="BentoGrid">
                  <div className="w-3 h-3 rounded-full border-[3px] border-blue-500 bg-white" data-aura-component-name="BentoGrid" />
                  <iconify-icon icon="lucide:credit-card" className="text-gray-400" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
                  <span className="text-base font-medium" data-aura-component-name="BentoGrid">
                    Card
                  </span>
                </div>
                <div className="p-2 border-b border-gray-200 text-gray-400 text-sm bg-gray-50/50" data-aura-component-name="BentoGrid">
                  Card number
                </div>
                <div className="flex divide-x divide-gray-200 bg-gray-50/50" data-aura-component-name="BentoGrid">
                  <div className="p-2 flex-1 text-gray-400 text-sm" data-aura-component-name="BentoGrid">
                    Expiration
                  </div>
                  <div className="p-2 flex-1 text-gray-400 text-sm flex items-center justify-between" data-aura-component-name="BentoGrid">
                    Security code
                    <iconify-icon icon="lucide:shield" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
                  </div>
                </div>
              </div>
              <div className="border border-gray-200 rounded-md overflow-hidden bg-white mb-4" data-aura-component-name="BentoGrid">
                <div className="p-2 border-b border-gray-200 flex items-center gap-2" data-aura-component-name="BentoGrid">
                  <div className="w-3 h-3 rounded-full border border-gray-300" data-aura-component-name="BentoGrid" />
                  <span className="text-base" data-aura-component-name="BentoGrid">
                    PayPay
                  </span>
                </div>
                <div className="p-2 flex items-center gap-2" data-aura-component-name="BentoGrid">
                  <div className="w-3 h-3 rounded-full border border-gray-300" data-aura-component-name="BentoGrid" />
                  <span className="text-base" data-aura-component-name="BentoGrid">
                    FamilyMart
                  </span>
                </div>
              </div>
              <button className="w-full py-2.5 bg-purple-500 text-white rounded-md font-medium text-base mt-auto" data-aura-component-name="BentoGrid">
                Continue
              </button>
            </div>
            <div className="w-[120px] pt-8" data-aura-component-name="BentoGrid">
              <h4 className="text-sm font-medium text-gray-500 mb-3" data-aura-component-name="BentoGrid">
                Order summary
              </h4>
              <div className="flex gap-2 mb-4" data-aura-component-name="BentoGrid">
                <div className="w-8 h-8 rounded bg-pink-100 flex items-center justify-center text-pink-500 font-medium text-lg flex-shrink-0" data-aura-component-name="BentoGrid">
                  S
                </div>
                <div>
                  <div className="text-xs text-gray-500 leading-tight mb-1" data-aura-component-name="BentoGrid">
                    Monthly streaming subscription
                  </div>
                  <div className="text-sm font-medium text-gray-900" data-aura-component-name="BentoGrid">
                    JP¥1,886.00
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 border-t border-gray-100 pt-3 text-sm" data-aura-component-name="BentoGrid">
                <div className="flex justify-between text-gray-500" data-aura-component-name="BentoGrid">
                  <span>
                    Subtotal
                  </span>
                  <span>
                    JP¥1,886.00
                  </span>
                </div>
                <div className="flex justify-between text-gray-500" data-aura-component-name="BentoGrid">
                  <span>
                    Tax
                  </span>
                  <span>
                    JP¥189.00
                  </span>
                </div>
                <div className="flex justify-between font-medium text-gray-900 pt-1.5 border-t border-gray-100" data-aura-component-name="BentoGrid">
                  <span>
                    Total
                  </span>
                  <span>
                    JP¥2,075.00
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  );
}
