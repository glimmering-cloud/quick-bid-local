import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ParsedRequest {
  title: string;
  category: string;
  description: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  requested_time: string;
  radius_km: number;
}

interface NaturalLanguageInputProps {
  onParsed: (parsed: ParsedRequest) => void;
}

const EXAMPLES = [
  "I need a haircut near Zurich station at 4 PM",
  "I need a plumber for a leaking sink",
  "AC cleaning needed tomorrow morning",
  "Electrician needed near Oerlikon",
  "Home cleaning this weekend near Altstetten",
];

export function NaturalLanguageInput({ onParsed }: NaturalLanguageInputProps) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) return;
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-request", {
        body: { text: text.trim() },
      });
      if (error) throw error;
      if (data?.parsed) {
        onParsed(data.parsed);
        toast.success("Request parsed! Review and submit below.");
        setText("");
      } else {
        toast.error("Could not parse your request. Try being more specific.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to parse request");
    }
    setParsing(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe what you need... e.g. 'I need a plumber near Zurich HB tomorrow at 10 AM'"
          rows={2}
          className="pr-24 resize-none"
        />
        <Button
          size="sm"
          onClick={handleParse}
          disabled={parsing || !text.trim()}
          className="absolute right-2 bottom-2"
        >
          {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {parsing ? "Parsing..." : "AI Parse"}
        </Button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setText(ex)}
            className="rounded-full border border-border bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
