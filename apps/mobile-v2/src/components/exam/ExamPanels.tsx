import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { resolveAssetUrl } from "@/lib/asset-url";
import { HighlightablePassage } from "@/components/HighlightablePassage";
import { useLogListeningPlayed } from "@/hooks/use-exam-session";
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
  const sortedSections = useMemo(
    () => [...sections].sort((a, b) => a.displayOrder - b.displayOrder || a.part - b.part),
    [sections],
  );
  const partGroups = useMemo(() => groupListeningSections(sortedSections), [sortedSections]);
  const [partIdx, setPartIdx] = useState(0);
  const [sectionInPartIdx, setSectionInPartIdx] = useState(0);
  const activeGroup = partGroups[partIdx];
  const section = activeGroup?.sections[sectionInPartIdx] ?? activeGroup?.sections[0];
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const shouldAutoPlayRef = useRef(false);
  const loggedSectionsRef = useRef<Set<string>>(new Set());
  const logPlayed = useLogListeningPlayed(sessionId);
  const logPlayedRef = useRef(logPlayed.mutate);

  useEffect(() => {
    logPlayedRef.current = logPlayed.mutate;
  }, [logPlayed.mutate]);

  useEffect(() => {
    setSectionInPartIdx(0);
    shouldAutoPlayRef.current = false;
  }, [partIdx]);

  useEffect(() => {
    if (ready || countdown <= 0) return;
    const id = setTimeout(() => setCountdown((v) => v - 1), 1000);
    return () => clearTimeout(id);
  }, [countdown, ready]);

  useEffect(() => {
    if (!section?.audioUrl) return;
    setAudioError(null);
    const audioUrl = resolveAssetUrl(section.audioUrl);
    const sectionId = section.id;
    const hasNextSection = sectionInPartIdx < (activeGroup?.sections.length ?? 0) - 1;
    let snd: Audio.Sound | null = null;
    let cancelled = false;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound: loaded } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: false },
          (st) => {
            if (!st.isLoaded) return;
            setPlaying(st.isPlaying);
            if (st.didJustFinish && hasNextSection) {
              shouldAutoPlayRef.current = true;
              setSectionInPartIdx((idx) => idx + 1);
            }
          },
        );
        if (cancelled) {
          await loaded.unloadAsync().catch(() => undefined);
          return;
        }
        snd = loaded;
        setSound(loaded);
        if (shouldAutoPlayRef.current) {
          shouldAutoPlayRef.current = false;
          logSectionPlayed(sectionId);
          await loaded.playAsync();
        }
      } catch {
        setSound(null);
        setPlaying(false);
        setAudioError(`Không tải được audio. Vui lòng thử lại hoặc báo lỗi nếu audio bị khóa quyền.`);
      }
    })();
    return () => {
      cancelled = true;
      snd?.unloadAsync().catch(() => undefined);
    };
  }, [section?.audioUrl, section?.id, sectionInPartIdx, activeGroup?.sections.length]);

  async function togglePlay() {
    if (!sound || !section) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      if (playing) await sound.pauseAsync();
      else {
        logSectionPlayed(section.id);
        await sound.playAsync();
      }
    } catch (e: unknown) {
      setPlaying(false);
      setAudioError(`Không phát được audio: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function logSectionPlayed(sectionId: string) {
    if (loggedSectionsRef.current.has(sectionId)) return;
    loggedSectionsRef.current.add(sectionId);
    logPlayedRef.current(sectionId);
  }

  const color = themeColors.light.skillListening;
  const activeItems = activeGroup?.sections.flatMap((sec) => sec.items) ?? [];

  if (!activeGroup || !section) return null;

  return (
    <ScrollView contentContainerStyle={[s.panelScroll, { paddingBottom: insets.bottom + 80 }]}>
      <ListeningReadyModal
        visible={!ready}
        countdown={countdown}
        totalParts={partGroups.length}
        totalQuestions={activeItems.length + partGroups.filter((_, i) => i !== partIdx).reduce((sum, g) => sum + g.sections.reduce((s, sec) => s + sec.items.length, 0), 0)}
        onReady={() => setReady(true)}
        c={c}
      />
      {partGroups.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.sectionTabs}>
          {partGroups.map((group, i) => {
            const answered = group.sections.reduce((sum, sec) => sum + sec.items.filter((it) => answers.has(it.id)).length, 0);
            const total = group.sections.reduce((sum, sec) => sum + sec.items.length, 0);
            return (
            <TouchableOpacity key={group.part} onPress={() => setPartIdx(i)} style={[s.sectionTab, { borderBottomColor: i === partIdx ? color : "transparent" }]}>
              <Text style={[s.sectionTabText, { color: i === partIdx ? color : c.mutedForeground }]}>Part {group.part} · {answered}/{total}</Text>
            </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
      <View style={[s.audioCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <Text style={[s.audioPartLabel, { color }]}>Part {activeGroup.part} · {section.partTitle}</Text>
        {activeGroup.sections.length > 1 ? (
          <Text style={[s.audioSubText, { color: c.mutedForeground }]}>Audio {sectionInPartIdx + 1}/{activeGroup.sections.length}</Text>
        ) : null}
        <TouchableOpacity onPress={togglePlay} disabled={!sound || !!audioError} style={[s.playBtn, { backgroundColor: audioError ? c.mutedForeground : color }]}>
          <Ionicons name={playing ? "pause" : "play"} size={22} color="#fff" />
          <Text style={s.playBtnText}>{playing ? "Tạm dừng" : "Phát audio"}</Text>
        </TouchableOpacity>
        {audioError && <Text style={[s.audioError, { color: c.destructive }]}>{audioError}</Text>}
      </View>
      {activeItems.map((item, qi) => (
        <McqCard key={item.id} item={item} index={qi} selected={answers.get(item.id) ?? null} onSelect={(idx) => onAnswer(item.id, idx)} color={color} c={c} />
      ))}
    </ScrollView>
  );
}

function ListeningReadyModal({
  visible,
  countdown,
  totalParts,
  totalQuestions,
  onReady,
  c,
}: {
  visible: boolean;
  countdown: number;
  totalParts: number;
  totalQuestions: number;
  onReady: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={s.readyOverlay}>
        <View style={[s.readyBox, { backgroundColor: c.card, borderColor: c.border }]}> 
          <View style={[s.readyIcon, { backgroundColor: c.infoTint }]}> 
            <Ionicons name="volume-high" size={30} color={c.info} />
          </View>
          <Text style={[s.readyTitle, { color: c.foreground }]}>Bạn đã sẵn sàng chưa?</Text>
          <Text style={[s.readyText, { color: c.mutedForeground }]}>Bạn có thể xem trước câu hỏi trước khi phát audio. Hãy đảm bảo tai nghe đã kết nối và âm lượng phù hợp.</Text>
          <View style={[s.readyInfo, { backgroundColor: c.background, borderColor: c.border }]}> 
            <Text style={[s.readyInfoText, { color: c.mutedForeground }]}>Bài thi gồm <Text style={{ color: c.foreground, fontFamily: fontFamily.bold }}>{totalParts} phần</Text> với <Text style={{ color: c.foreground, fontFamily: fontFamily.bold }}>{totalQuestions} câu hỏi</Text>.</Text>
            <Text style={[s.readyInfoText, { color: c.mutedForeground }]}>Âm thanh mỗi phần chỉ phát một lần duy nhất, không thể tua lại.</Text>
          </View>
          <TouchableOpacity disabled={countdown > 0} onPress={onReady} style={[s.readyButton, { backgroundColor: c.primary, opacity: countdown > 0 ? 0.5 : 1 }]}> 
            <Text style={[s.readyButtonText, { color: c.primaryForeground }]}>{countdown > 0 ? `Sẵn sàng (${countdown}s)` : "Bắt đầu làm bài"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function groupListeningSections(sections: ExamVersionListeningSection[]) {
  const map = new Map<number, ExamVersionListeningSection[]>();
  for (const section of sections) {
    const list = map.get(section.part) ?? [];
    list.push(section);
    map.set(section.part, list);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([part, grouped]) => ({ part, sections: grouped }));
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
  audioSubText: { fontSize: fontSize.xs, fontFamily: fontFamily.semiBold },
  playBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.full, alignSelf: "flex-start" },
  playBtnText: { color: "#fff", fontSize: fontSize.sm, fontFamily: fontFamily.bold },
  audioError: { fontSize: fontSize.xs, fontFamily: fontFamily.medium },
  readyOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  readyBox: { width: "100%", borderWidth: 2, borderBottomWidth: 4, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.md },
  readyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", alignSelf: "center" },
  readyTitle: { fontSize: fontSize.xl, fontFamily: fontFamily.extraBold, textAlign: "center" },
  readyText: { fontSize: fontSize.sm, lineHeight: 20, textAlign: "center" },
  readyInfo: { borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  readyInfoText: { fontSize: fontSize.sm, lineHeight: 20, textAlign: "center" },
  readyButton: { minHeight: 48, borderRadius: radius.button, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  readyButtonText: { fontSize: fontSize.sm, fontFamily: fontFamily.extraBold, textTransform: "uppercase" },
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
