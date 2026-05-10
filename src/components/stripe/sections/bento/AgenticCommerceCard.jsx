import React from "react";

export default function AgenticCommerceCard() {
  return (
    <div className="lg:col-span-1 relative bg-white rounded-3xl overflow-hidden border border-gray-200/60 shadow-sm group min-h-[500px] cursor-pointer p-8 flex flex-col" data-aura-component-name="BentoGrid">
      <div className="absolute inset-0 bg-[radial-gradient(#fbcfe8_1px,transparent_1px)] [background-size:12px_12px] opacity-40" data-aura-component-name="BentoGrid" />
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-transparent" data-aura-component-name="BentoGrid" />
      <div className="absolute inset-0 bg-gradient-to-t from-pink-50/50 to-transparent pointer-events-none" data-aura-component-name="BentoGrid" />
      <div className="relative z-20 flex justify-between" data-aura-component-name="BentoGrid">
        <h3 className="text-2xl font-medium tracking-tight text-gray-900 max-w-[200px] leading-tight" data-aura-component-name="BentoGrid">
          Monetise through agentic commerce
        </h3>
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" data-aura-component-name="BentoGrid">
          <iconify-icon icon="lucide:expand" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
        </div>
      </div>
      <div className="relative z-10 mt-auto flex flex-col w-full" data-aura-component-name="BentoGrid">
        <div className="w-[90%] self-end bg-white rounded-2xl rounded-tr-sm p-4 shadow-sm border border-gray-100 mb-4 transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500 ease-out" data-aura-component-name="BentoGrid">
          <p className="text-base text-gray-800" data-aura-component-name="BentoGrid">
            I'm refreshing my wardrobe. Can you recommend some cosy, comfortable basics in size M?
          </p>
        </div>
        <div className="w-[95%] self-start bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-gray-100 transform translate-y-12 group-hover:translate-y-0 transition-transform duration-500 delay-75 ease-out" data-aura-component-name="BentoGrid">
          <p className="text-base text-gray-800 mb-4" data-aura-component-name="BentoGrid">
            Absolutely. Here are a few comfy essentials that pair well and could be a good starting point:
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4" data-aura-component-name="BentoGrid">
            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/30" data-aura-component-name="BentoGrid">
              <div className="w-full aspect-square bg-[#0055ff]/10 rounded-lg mb-3 flex items-center justify-center" data-aura-component-name="BentoGrid">
                <iconify-icon icon="lucide:shirt" className="text-[#0055ff] text-4xl" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
              </div>
              <div className="text-sm font-medium text-gray-900" data-aura-component-name="BentoGrid">
                Deluxe Shirt
              </div>
              <div className="text-xs text-gray-500 mb-1" data-aura-component-name="BentoGrid">
                Blue - Medium
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1" data-aura-component-name="BentoGrid">
                CA$35.00
              </div>
              <div className="text-xs text-gray-400" data-aura-component-name="BentoGrid">
                Cartsy
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/30" data-aura-component-name="BentoGrid">
              <div className="w-full aspect-square bg-[#0a2540]/10 rounded-lg mb-3 flex items-center justify-center" data-aura-component-name="BentoGrid">
                <iconify-icon icon="lucide:shirt" className="text-[#0a2540] text-4xl" strokeWidth="1.5" data-aura-component-name="BentoGrid" />
              </div>
              <div className="text-sm font-medium text-gray-900" data-aura-component-name="BentoGrid">
                Essential Hoodie
              </div>
              <div className="text-xs text-gray-500 mb-1" data-aura-component-name="BentoGrid">
                Navy - Medium
              </div>
              <div className="text-sm font-medium text-gray-900 mb-1" data-aura-component-name="BentoGrid">
                CA$65.00
              </div>
              <div className="text-xs text-gray-400" data-aura-component-name="BentoGrid">
                Cartsy
              </div>
            </div>
          </div>
          <button className="w-full py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium text-base transition-colors" data-aura-component-name="BentoGrid">
            Buy now
          </button>
        </div>
      </div>
    </div>
    
  );
}
