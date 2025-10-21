const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#FB704B] border-opacity-50" />
    </div>
  );
};

export default LoadingScreen;
