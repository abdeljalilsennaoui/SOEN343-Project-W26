function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-md mb-4">
      <span className="font-semibold">{error.code || 'Error'}:</span> {error.message}
    </div>
  );
}

export default ErrorMessage;
