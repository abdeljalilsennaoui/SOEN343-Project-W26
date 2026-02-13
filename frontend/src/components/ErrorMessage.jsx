function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="error-message">
      <strong>{error.code || 'Error'}:</strong> {error.message}
    </div>
  );
}

export default ErrorMessage;
