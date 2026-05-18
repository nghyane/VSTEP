import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { resolveAssetUrl } from "@/lib/asset-url";
import { HighlightablePassage } from "@/components/HighlightablePassage";
import { useThemeColors, spacing, radius, fontSize, fontFamily, colors as themeColors } from "@/theme";
import type { ExamVersionMcqItem, ExamVersionListeningSection, ExamVersionReadingPassage, ExamVersionWritingTask } from "@/types/api";

// ── Listening Panel ──

interface ListeningPanelProps {
  sections: ExamVersionListeningSection[];
  sessionId: string;
  answers: Map<string, number>;
  onAnswer: (itemId: string, idx: number) => void;
  c: ReturnType<typeof useThemeColors>;
  insets: { bottom: number };
}

export function ListeningPanel({ sections, sessionId, answers, onAnswer, c, insets }: ListeningPanelProps) {
  const [sectionIdx, setSectionIdx] = useState(0);
  const section = sections[sectionIdx];
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    if (!section?.audioUrl) return;
    setAudioError(null);
    const audioUrl = resolveAssetUrl(section.audioUrl);
    let snd: Audio.Sound | null = null;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: loaded } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          (st) => { if (st.isLoaded) setPlaying(st.isPlaying); },
        );
        snd = loaded;
        setSound(loaded);
      } catch (e: unknown) {
        setSound(null);
        setPlaying(false);
        setAudioError(`Không tải được audio: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
    return () => { snd?.unloadAsync().catch(() => undefined); };
  }, [section?.audioUrl, sessionId]);

  async function togglePlay() {
    if (!sound) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (playing) await sound.pauseAsync(); else await sound.playAsync();
    } catch (e: unknown) {
      setPlaying(false);
      setAudioError(`Không phát được audio: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const color = themeColors.light.skillListening;

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
      {sections.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {sections.map((sec, i) => (
            <TouchableOpacity key={sec.id} onPress={() => setSectionIdx(i)} style={[s.sectionTab, { borderBottomColor: i === sectionIdx ? color : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === sectionIdx ? color : c.mutedForeground }]}>Part {sec.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.audioCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.audioPartLabel, { color }]}>Part {section.part} · {section.partTitle}</Text>
        <TouchableOpacity onPress={togglePlay} disabled={!sound || !!audioError} style={[s.playBtn, { backgroundColor: audioError ? c.mutedForeground : color }]}>
          <Ionicons name={playing ? "pause" : "play"} size={22} color="#fff" />
          <Text style={s.playBtnText}>{playing ? "Tạm dừng" : "Phát audio"}</Text>
        </TouchableOpacity>
        {audioError && <Text style={[s.audioError, { color: c.destructive }]}>{audioError}</Text>}
      </View>
      {section.items.map((item, qi) => (
        <McqCard key={item.id} item={item} index={qi} selected={answers.get(item.id) ?? null} onSelect={(idx) => onAnswer(item.id, idx)} color={color} c={c} />
      ))}
    </ScrollView>
  );
}

// ── Reading Panel ──

interface ReadingPanelProps {
  passages: ExamVersionReadingPassage[];
  answers: Map<string, number>;
  onAnswer: (itemId: string, idx: number) => void;
  c: ReturnType<typeof useThemeColors>;
  insets: { bottom: number };
}

export function ReadingPanel({ passages, answers, onAnswer, c, insets }: ReadingPanelProps) {
  const [passageIdx, setPassageIdx] = useState(0);
  const [showPassage, setShowPassage] = useState(true);
  const passage = passages[passageIdx];
  const color = themeColors.light.skillReading;

  return (
    <View style={{ flex: 1 }}>
      {passages.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {passages.map((p, i) => (
            <TouchableOpacity key={p.id} onPress={() => setPassageIdx(i)} style={[s.sectionTab, { borderBottomColor: i === passageIdx ? color : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === passageIdx ? color : c.mutedForeground }]}>Part {p.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.toggleRow, { borderBottomColor: c.borderLight }]}>
        <TouchableOpacity style={[s.toggleBtn, showPassage && { borderBottomColor: color, borderBottomWidth: 2 }]} onPress={() => setShowPassage(true)}>
          <Text style={[s.toggleText, { color: showPassage ? color : c.mutedForeground }]}>Đoạn văn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.toggleBtn, !showPassage && { borderBottomColor: color, borderBottomWidth: 2 }]} onPress={() => setShowPassage(false)}>
          <Text style={[s.toggleText, { color: !showPassage ? color : c.mutedForeground }]}>Câu hỏi</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
        {showPassage ? (
          <View style={[s.passageCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={[s.passageTitle, { color }]}>Part {passage.part} · {passage.title}</Text>
            <HighlightablePassage text={passage.passage} passageId={passage.id} />
          </View>
        ) : (
          passage.items.map((item, qi) => (
            <McqCard key={item.id} item={item} index={qi} selected={answers.get(item.id) ?? null} onSelect={(idx) => onAnswer(item.id, idx)} color={color} c={c} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ── Writing Panel ──

interface WritingPanelProps {
  tasks: ExamVersionWritingTask[];
  answers: Map<string, string>;
  onAnswer: (taskId: string, text: string) => void;
  c: ReturnType<typeof useThemeColors>;
  insets: { bottom: number };
}

export function WritingPanel({ tasks, answers, onAnswer, c, insets }: WritingPanelProps) {
  const [taskIdx, setTaskIdx] = useState(0);
  const task = tasks[taskIdx];
  const text = answers.get(task.id) ?? "";
  const wc = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const inRange = wc >= task.minWords;
  const color = themeColors.light.skillWriting;

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]} keyboardShouldPersistTaps="handled">
      {tasks.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {tasks.map((t, i) => (
            <TouchableOpacity key={t.id} onPress={() => setTaskIdx(i)} style={[s.sectionTab, { borderBottomColor: i === taskIdx ? color : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === taskIdx ? color : c.mutedForeground }]}>Task {t.part}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <View style={[s.promptCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.promptLabel, { color }]}>Task {task.part} · {task.taskType}</Text>
        <Text style={[s.promptText, { color: c.foreground }]}>{task.prompt}</Text>
        <Text style={[s.promptMeta, { color: c.subtle }]}>Tối thiểu {task.minWords} từ</Text>
      </View>
      <View style={[s.editorCard, { backgroundColor: c.card, borderColor: inRange ? color : c.border }]}>
          <TextInput
            style={[s.editor, { color: c.foreground }]}
            value={text}
            onChangeText={(v: string) => onAnswer(task.id, v)}
            placeholder="Viết bài của bạn ở đây..."
            placeholderTextColor={c.placeholder}
            multiline
            textAlignVertical="top"
          />
        <Text style={[s.wcBadge, { color: inRange ? color : c.subtle }]}>{wc} / {task.minWords}+ từ</Text>
      </View>
    </ScrollView>
  );
}

// ── MCQ Card ──

interface McqCardProps {
  item: ExamVersionMcqItem;
  index: number;
  selected: number | null;
  onSelect: (idx: number) => void;
  color: string;
  c: ReturnType<typeof useThemeColors>;
}

function McqCard({ item, index, selected, onSelect, color, c }: McqCardProps) {
  return (
    <View style={[s.qCard, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[s.qNum, { color }]}>Câu {index + 1}</Text>
      <Text style={[s.qStem, { color: c.foreground }]}>{item.stem}</Text>
      <View style={s.options}>
        {item.options.map((opt, i) => {
          const sel = selected === i;
          return (
            <TouchableOpacity key={i} onPress={() => onSelect(i)}
              style={[s.option, { borderColor: sel ? color : c.border, backgroundColor: sel ? color + "18" : c.card }]}>
              <View style={[s.optDot, { borderColor: sel ? color : c.border, backgroundColor: sel ? color : "transparent" }]}>
                {sel && <View style={s.optDotInner} />}
              </View>
              <Text style={[s.optText, { color: sel ? color : c.foreground }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panelScroll: { padding: spacing.xl, gap: spacing.lg },
  sectionTabs: { borderBottomWidth: 1, flexGrow: 0 },
  sectionTab: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 2 },
  sectionTabText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  toggleRow: { flexDirection: "row", borderBottomWidth: 1 },
  toggleBtn: { flex: 1, alignItems: "center", paddingVertical: spacing.md },
  toggleText: { fontSize: fontSize.sm, fontFamily: fontFamily.semiBold },
  audioCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  audioPartLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  playBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full, alignSelf: "flex-start" },
  playBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  audioError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  passageCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  passageTitle: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  promptCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  promptLabel: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  promptText: { fontSize: fontSize.sm, lineHeight: 22 },
  promptMeta: { fontSize: fontSize.xs },
  editorCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, minHeight: 240 },
  editor: { fontSize: fontSize.sm, lineHeight: 22, minHeight: 200 },
  wcBadge: { fontSize: fontSize.xs, fontFamily: fontFamily.bold, textAlign: "right", marginTop: spacing.sm },
  qCard: { borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  qNum: { fontSize: fontSize.xs, fontFamily: fontFamily.extraBold },
  qStem: { fontSize: fontSize.base, fontFamily: fontFamily.semiBold, lineHeight: 24 },
  options: { gap: spacing.sm },
  option: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md },
  optDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  optDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  optText: { flex: 1, fontSize: fontSize.sm, lineHeight: 20 },
});
