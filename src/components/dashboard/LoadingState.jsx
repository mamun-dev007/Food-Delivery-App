import { Loader2 } from "lucide-react";

const LoadingState = ({ label = "Loading..." }) => (
  <div className="flex items-center justify-center gap-2 py-24 text-sm text-base-content/50">
    <Loader2 className="h-5 w-5 animate-spin" />
    {label}
  </div>
);

export default LoadingState;