interface FormActionsProps {
  onSave: () => void;
  onSubmit: () => void;
  isSaving: boolean;
  isSubmitting: boolean;
}

export default function FormActions({
  onSave,
  onSubmit,
  isSaving,
  isSubmitting,
}: FormActionsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex gap-4">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Final'}
        </button>
      </div>
    </div>
  );
}

