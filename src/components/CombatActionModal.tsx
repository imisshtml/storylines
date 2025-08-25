import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { X, Swords, Shield, Hand, Footprints, Sparkles } from 'lucide-react-native';

export type CombatAttackType =
  | 'Unarmed Strike'
  | 'Grapple'
  | 'Shove'
  | 'Improvised Weapon'
  | 'Help'
  | 'Dodge'
  | 'Disengage';

export interface CombatTarget {
  id: string;
  kind: 'pc' | 'npc';
  name: string;
}

interface CombatActionModalProps {
  visible: boolean;
  loadingTargets?: boolean;
  targets: CombatTarget[];
  onClose: () => void;
  onConfirm: (selection: { attackType: CombatAttackType; target: CombatTarget | null }) => void;
  onShown?: () => void;
}

const ATTACKS: { label: CombatAttackType; icon: React.ReactNode; needsTarget: boolean }[] = [
  { label: 'Unarmed Strike', icon: <Swords size={16} color="#fff" />, needsTarget: true },
  { label: 'Grapple', icon: <Hand size={16} color="#fff" />, needsTarget: true },
  { label: 'Shove', icon: <Hand size={16} color="#fff" />, needsTarget: true },
  { label: 'Improvised Weapon', icon: <Swords size={16} color="#fff" />, needsTarget: true },
  { label: 'Help', icon: <Sparkles size={16} color="#fff" />, needsTarget: true },
  { label: 'Dodge', icon: <Shield size={16} color="#fff" />, needsTarget: false },
  { label: 'Disengage', icon: <Footprints size={16} color="#fff" />, needsTarget: false },
];

export default function CombatActionModal({ visible, loadingTargets, targets, onClose, onConfirm, onShown }: CombatActionModalProps) {
  const [selectedAttack, setSelectedAttack] = useState<CombatAttackType | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setSelectedAttack(null);
      setSelectedTargetId(null);
    } else {
      // Notify parent that overlay is mounted/visible
      try { onShown && onShown(); } catch {}
    }
  }, [visible]);

  const selectedTarget = useMemo(() => targets.find(t => t.id === selectedTargetId) || null, [targets, selectedTargetId]);
  const attackMeta = useMemo(() => ATTACKS.find(a => a.label === selectedAttack) || null, [selectedAttack]);

  const canConfirm = useMemo(() => {
    if (!selectedAttack) return false;
    if (attackMeta?.needsTarget) return !!selectedTarget;
    return true;
  }, [selectedAttack, attackMeta, selectedTarget]);

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Combat Actions</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.sectionLabel}>Choose your action</Text>
        <View style={styles.attackGrid}>
          {ATTACKS.map(a => (
            <TouchableOpacity
              key={a.label}
              style={[styles.attackPill, selectedAttack === a.label && styles.attackPillSelected]}
              onPress={() => setSelectedAttack(a.label)}
              activeOpacity={0.8}
            >
              {a.icon}
              <Text style={styles.attackPillText}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Always show targets so players can see available people immediately */}
        <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Pick a target</Text>
        {loadingTargets ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <View style={styles.targetList}>
            {targets.length === 0 ? (
              <Text style={styles.emptyText}>No targets detected nearby.</Text>
            ) : (
              targets.map(t => (
                <TouchableOpacity
                  key={`${t.kind}:${t.id}`}
                  style={[styles.targetItem, selectedTargetId === t.id && styles.targetItemSelected]}
                  onPress={() => {
                    setSelectedTargetId(t.id);
                    if (!selectedAttack) setSelectedAttack('Unarmed Strike');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.targetText}>{t.name} {t.kind === 'pc' ? '(ally)' : ''}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          disabled={!canConfirm}
          onPress={() => onConfirm({ attackType: selectedAttack as CombatAttackType, target: selectedTarget })}
        >
          <Text style={styles.confirmText}>{attackMeta?.needsTarget ? 'Confirm Action' : 'Take Action'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!visible) return null;

  if (Platform.OS === 'android') {
    return (
      <View style={styles.portal} pointerEvents="box-none">
        {renderContent()}
      </View>
    );
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {renderContent()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  portal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 20,
  },
  container: { flex: 1, backgroundColor: 'rgba(18, 18, 18, 0.98)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  title: { color: '#fff', fontFamily: 'Inter-Bold', fontSize: 18 },
  closeBtn: { padding: 8 },
  content: { flex: 1, padding: 16 },
  sectionLabel: { color: '#aaa', fontFamily: 'Inter-SemiBold', marginBottom: 8 },
  attackGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  attackPill: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#2a2a2a', borderRadius: 9999, borderWidth: 2, borderColor: 'transparent' },
  attackPillSelected: { borderColor: '#E91E63', backgroundColor: 'rgba(233, 30, 99, 0.1)' },
  attackPillText: { color: '#fff', fontFamily: 'Inter-Medium' },
  loadingBox: { padding: 16, alignItems: 'center' },
  targetList: { gap: 8 },
  targetItem: { paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#1e1e1e', borderWidth: 2, borderColor: 'transparent' },
  targetItemSelected: { borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  targetText: { color: '#fff', fontFamily: 'Inter-Medium' },
  emptyText: { color: '#888', fontFamily: 'Inter-Regular' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  confirmBtn: { backgroundColor: '#E91E63', borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  confirmBtnDisabled: { backgroundColor: '#666' },
  confirmText: { color: '#000', fontFamily: 'Inter-Bold', fontSize: 16 },
}); 