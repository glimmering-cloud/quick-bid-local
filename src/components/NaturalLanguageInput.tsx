import { useState } from "react";
import { useTranslation } from "react-i18next";
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

export function NaturalLanguageInput({ onParsed }: NaturalLanguageInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);

  const EXAMPLES = [
    "I need a haircut near Zurich station at 4 PM",
    "Plumber needed in Bern tomorrow morning",
    "AC cleaning in Lausanne this weekend",
    "Electrician needed near Genève Cornavin",
    "Home cleaning in Zurich Oerlikon",
  ];

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
        toast.success(t("nlp.parsed"));
        setText("");
      } else {
        toast.error(t("nlp.parseFailed"));
      }
    } catch (err: any) {
      toast.error(err.message || t("nlp.parseFailed"));
    }
    setParsing(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("nlp.placeholder")}
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
          {parsing ? t("nlp.parsing") : t("nlp.parse")}
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
