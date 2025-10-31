interface FormInfoProps {
  nickname: string;
  isFinal: boolean;
}

export default function FormInfo({ nickname, isFinal }: FormInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">{nickname}</h2>
          <p className="text-sm text-gray-600">
            Status: {isFinal ? 'Final (Locked)' : 'Draft'}
          </p>
        </div>
        {isFinal && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            Submitted
          </span>
        )}
      </div>
    </div>
  );
}

