import React from "react";
import { State } from "../helpers/use-rendering";
import { Button } from "./ui/button";
import { Undo2, Download } from "lucide-react";

const Megabytes: React.FC<{
  sizeInBytes: number;
}> = ({ sizeInBytes }) => {
  const megabytes = Intl.NumberFormat("en", {
    notation: "compact",
    style: "unit",
    unit: "byte",
    unitDisplay: "narrow",
  }).format(sizeInBytes);
  return <span className="text-muted-foreground">{megabytes}</span>;
};

export const DownloadButton: React.FC<{
  state: State;
  undo: () => void;
}> = ({ state, undo }) => {
  if (state.status === "rendering") {
    return <Button disabled>Download video</Button>;
  }

  if (state.status !== "done") {
    throw new Error("Download button should not be rendered when not done");
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={undo} size="icon">
        <Undo2 className="h-4 w-4" />
      </Button>
      <a href={state.url} className="no-underline">
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Download video
          <span className="ml-2">
            <Megabytes sizeInBytes={state.size} />
          </span>
        </Button>
      </a>
    </div>
  );
};
