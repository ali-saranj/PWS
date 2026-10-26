'use client';

import React from 'react';
import { Layers, Tag, Check } from 'lucide-react';
import { VolumeTier } from '@/lib/productDetail';
import { formatToman, toPersianDigits } from '@/lib/format';

export interface VolumeTierTableProps {
  basePriceToman: number;
  volumeTiers: VolumeTier[];
  quantity: number;
  className?: string;
}

export const VolumeTierTable: React.FC<VolumeTierTableProps> = ({
  basePriceToman,
  volumeTiers,
  quantity,
  className = '',
}) => {
  if (!volumeTiers || volumeTiers.length === 0) {
    return null;
  }

  // Find the single highest qualifying tier
  const activeTier = [...volumeTiers]
    .sort((a, b) => b.minQuantity - a.minQuantity)
    .find((tier) => quantity >= tier.minQuantity);

  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-black text-emerald-950">
            تخفیف پلکانی و خرید عمده
          </h3>
          <p className="text-[11px] text-emerald-700">
            با سفارش تعداد بیشتر، قیمت واحد محصول کاهش می‌یابد
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-200/70 bg-white">
        <table className="w-full text-right text-xs">
          <thead>
            <tr className="bg-emerald-50/80 border-b border-emerald-100 text-emerald-900 font-bold">
              <th className="py-2.5 px-3">حداقل تعداد</th>
              <th className="py-2.5 px-3">درصد تخفیف</th>
              <th className="py-2.5 px-3">قیمت هر واحد</th>
              <th className="py-2.5 px-3 text-center">وضعیت</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {volumeTiers.map((tier) => {
              const isActive = activeTier?.minQuantity === tier.minQuantity;
              const discountedUnit = Math.round(
                basePriceToman * (1 - tier.discountPercent / 100)
              );

              return (
                <tr
                  key={tier.minQuantity}
                  data-testid={`volume-tier-${tier.minQuantity}`}
                  data-active={isActive ? 'true' : 'false'}
                  className={`transition-colors ${
                    isActive
                      ? 'bg-emerald-100/70 font-semibold text-emerald-950'
                      : 'hover:bg-gray-50/80 text-gray-700'
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <span className="font-bold">
                      {toPersianDigits(tier.minQuantity)} عدد به بالا
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-600 border border-rose-200">
                      <Tag className="w-3 h-3" />
                      {toPersianDigits(tier.discountPercent)}٪
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-gray-900">
                        {formatToman(discountedUnit)}
                      </span>
                      <span className="text-[10px] text-gray-500">تومان</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                        فعال
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-400 font-normal">
                        غیرفعال
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VolumeTierTable;
