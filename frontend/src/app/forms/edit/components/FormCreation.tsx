interface FormCreationProps {
  nickname: string;
  onNicknameChange: (nickname: string) => void;
  onCreate: () => void;
  isLoading: boolean;
}

export default function FormCreation({
  nickname,
  onNicknameChange,
  onCreate,
  isLoading,
}: FormCreationProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Create Your Form</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
            Nickname *
          </label>
          <input
            type="text"
            id="nickname"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your nickname"
            disabled={isLoading}
          />
        </div>
        <button
          onClick={onCreate}
          disabled={isLoading || !nickname.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Form'}
        </button>
      </div>
    </div>
  );
}

