import React from "react";
import { Progress } from "./ui/progress";

export const ProgressBar: React.FC<{
  progress: number;
}> = ({ progress }) => {
  return (
    <div className="w-full mt-2.5 mb-6">
      <Progress value={progress * 100} />
    </div>
  );
};
