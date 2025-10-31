interface MessageBannerProps {
  message: { type: 'success' | 'error'; text: string } | null;
}

export default function MessageBanner({ message }: MessageBannerProps) {
  if (!message) return null;

  return (
    <div
      className={`mb-6 p-4 rounded-lg ${
        message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
      }`}
    >
      {message.text}
    </div>
  );
}

