"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Copy,
  Save,
  Trash,
} from "lucide-react";

function ButtonGroupDemo() {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-4">
        <div className="space-y-3">
          <ButtonGroup size="sm">
            <Button variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="outline">
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </ButtonGroup>
        </div>
    </div>
  );
}

export { ButtonGroupDemo }; 
