'use client';

import Link from 'next/link';
import { useLeague } from '../../lib/useLeague';

interface CTAButtonsProps {
  formId?: string;
}

export default function CTAButtons({ formId }: CTAButtonsProps) {
  const { leagueId } = useLeague();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/forms/edit"
          className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors block"
        >
          {formId ? 'Edit My Predictions' : 'Create Predictions'}
        </Link>

        <Link
          href="/simulate"
          className="bg-green-600 hover:bg-green-700 text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors block"
        >
          תוצאות אמת
        </Link>
      </div>

      <div className="mt-3 text-center text-sm text-gray-500">
        League: {leagueId}
      </div>
    </div>
  );
}
