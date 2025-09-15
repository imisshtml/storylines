import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput, Keyboard } from 'react-native';
import { X, Swords, Shield, Hand, Footprints, Sparkles, Package, Zap } from 'lucide-react-native';
import { type Character, type DnDSpell, type Equipment } from '../atoms/characterAtoms';

export type CombatActionType = string; // Dynamic based on character's available actions

export type CombatActionCategory = 'basic' | 'weapon' | 'spell' | 'item';

export interface CombatTarget {
  id: string;
  kind: 'pc' | 'npc';
  name: string;
}

export interface CombatAction {
  id: string;
  name: string;
  category: CombatActionCategory;
  icon: React.ReactNode;
  needsTarget: boolean;
  description?: string;
  sourceItem?: Equipment;
  sourceSpell?: DnDSpell;
}

interface CombatActionModalProps {
  visible: boolean;
  loadingTargets?: boolean;
  targets: CombatTarget[];
  character?: Character; // Added to get spells and equipment
  onClose: () => void;
  onConfirm: (selection: { 
    action: CombatAction; 
    targets: CombatTarget[]; 
    details: string; 
  }) => void;
  onShown?: () => void;
  // Combat persistence props
  lastSelectedActionId?: string; // ID of the last selected action
  lastSelectedTargetIds?: string[]; // IDs of the last selected targets
  lastSelectedTargetNames?: string[]; // Names of the last selected targets (fallback for ID changes)
  onSelectionChange?: (actionId: string | null, targetIds: string[]) => void; // Callback to persist selection
}

const BASIC_ACTIONS: CombatAction[] = [
  { id: 'unarmed', name: 'Unarmed Strike', category: 'basic', icon: <Swords size={16} color="#fff" />, needsTarget: true },
  { id: 'grapple', name: 'Grapple', category: 'basic', icon: <Hand size={16} color="#fff" />, needsTarget: true },
  { id: 'shove', name: 'Shove', category: 'basic', icon: <Hand size={16} color="#fff" />, needsTarget: true },
  { id: 'help', name: 'Help', category: 'basic', icon: <Sparkles size={16} color="#fff" />, needsTarget: true },
  { id: 'dodge', name: 'Dodge', category: 'basic', icon: <Shield size={16} color="#fff" />, needsTarget: false },
  { id: 'disengage', name: 'Disengage', category: 'basic', icon: <Footprints size={16} color="#fff" />, needsTarget: false },
];

export default function CombatActionModal({ visible, loadingTargets, targets, character, onClose, onConfirm, onShown, lastSelectedActionId, lastSelectedTargetIds, lastSelectedTargetNames, onSelectionChange }: CombatActionModalProps) {
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [targetDropdownOpen, setTargetDropdownOpen] = useState<boolean>(false);
  const [details, setDetails] = useState<string>('');
  // Generate all available actions based on character's spells and equipment
  const availableActions = useMemo(() => {
    const actions: CombatAction[] = [...BASIC_ACTIONS];
    console.log('===============================')
      console.log('basics');
      console.log('===============================')
    
    // Helper function to check if character can cast spells
    const canCastSpells = (character: Character) => {
      const spellcastingClasses = ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'];
      const partialSpellcastingClasses = ['Eldritch Knight', 'Arcane Trickster']; // Subclasses
      
      return spellcastingClasses.includes(character.class) || 
             partialSpellcastingClasses.some(subclass => character.class.includes(subclass)) ||
             (character.level >= 3 && ['Paladin', 'Ranger'].includes(character.class));
    };
    
    // Add weapon attacks from equipped weapons only
    console.log('eq ', character?.equipment, );
    if (character?.equipment && character?.equipped_items) {
      const equippedWeapons: Equipment[] = [];
      
      // Check equipped items for weapons
      if (character.equipped_items.leftHand && character.equipped_items.leftHand.equipment_category === 'Weapon') {
        equippedWeapons.push(character.equipped_items.leftHand);
      }
      if (character.equipped_items.rightHand && character.equipped_items.rightHand.equipment_category === 'Weapon') {
        equippedWeapons.push(character.equipped_items.rightHand);
      }
      
      // If no equipped weapons found, check inventory for actual weapons (fallback)
      if (equippedWeapons.length === 0) {
        const inventoryWeapons = character.equipment.filter(eq => 
          eq.equipment_category === 'Weapon' && eq.enabled
        );
        equippedWeapons.push(...inventoryWeapons);
      }
      console.log('===============================')
      console.log('equippedWeapons', equippedWeapons)
      console.log('===============================')
      equippedWeapons.forEach(weapon => {
        actions.push({
          id: `weapon_${weapon.id}`,
          name: `Attack with ${weapon.name}`,
          category: 'weapon',
          icon: <Swords size={16} color="#fff" />,
          needsTarget: true,
          description: Array.isArray(weapon.description) ? weapon.description.join(' ') : weapon.description,
          sourceItem: weapon
        });
      });
    }
    
    // Add spell attacks from spells (only if character can cast spells)
    if (character?.spells && character && canCastSpells(character)) {
      const combatSpells = character.spells.filter(spell => {
        // Check if character has spell slots for this level
        const hasSlots = !character.spell_slots_max || 
                        !character.spell_slots_used || 
                        (character.spell_slots_max[spell.level.toString()] || 0) > 
                        (character.spell_slots_used[spell.level.toString()] || 0);
        
        // Filter for combat-relevant spells
        const isCombatSpell = spell.level >= 0 && (
          spell.name.toLowerCase().includes('bolt') ||
          spell.name.toLowerCase().includes('missile') ||
          spell.name.toLowerCase().includes('ray') ||
          spell.name.toLowerCase().includes('flame') ||
          spell.name.toLowerCase().includes('shock') ||
          spell.name.toLowerCase().includes('heal') ||
          spell.name.toLowerCase().includes('cure') ||
          spell.name.toLowerCase().includes('sacred') ||
          spell.school.name === 'Evocation' ||
          spell.school.name === 'Enchantment' ||
          spell.school.name === 'Necromancy' ||
          (spell.level === 0) // Cantrips are always available
        );
        
        return isCombatSpell && (spell.level === 0 || hasSlots);
      });
      
      combatSpells.forEach(spell => {
        const isCantrip = spell.level === 0;
        actions.push({
          id: `spell_${spell.index}`,
          name: `Cast ${spell.name}${!isCantrip ? ` (Level ${spell.level})` : ' (Cantrip)'}`,
          category: 'spell',
          icon: <Zap size={16} color="#fff" />,
          needsTarget: spell.range !== 'Self',
          description: spell.description.join(' ').substring(0, 100) + '...',
          sourceSpell: spell
        });
      });
    }
    
    // Add consumable items (only items that can be used in combat)
    if (character?.equipment) {
      const consumables = character.equipment.filter((eq: any) => {
        if (!eq.enabled || (eq.quantity !== undefined && eq.quantity <= 0)) return false;
        
        const name = String(eq.name || '').toLowerCase();
        const desc = Array.isArray(eq.description) ? eq.description.join(' ').toLowerCase() : String(eq.description || '').toLowerCase();
        
        // Combat-usable consumables
        const isCombatUsable = (
          name.includes('potion') ||
          name.includes('bomb') ||
          name.includes('oil') ||
          name.includes('alchemist') ||
          name.includes('flask') ||
          name.includes('vial') ||
          name.includes('scroll') ||
          desc.includes('as an action') ||
          desc.includes('bonus action') ||
          desc.includes('drink') ||
          desc.includes('throw')
        ) && (
          eq.equipment_category === 'Adventuring Gear' ||
          eq.equipment_category === 'Wondrous Items' ||
          eq.equipment_category === 'Potion'
        );
        
        return isCombatUsable;
      });
      
      consumables.forEach((item: any) => {
        const itemName = String(item.name || '').toLowerCase();
        let needsTarget = true;
        if (itemName.includes('potion') || itemName.includes('drink')) {
          needsTarget = false;
        } else if (Array.isArray(item.description)) {
          needsTarget = !item.description.join(' ').toLowerCase().includes('drink');
        }
        
        actions.push({
          id: `item_${item.id}`,
          name: `Use ${item.name}${item.quantity ? ` (${item.quantity})` : ''}`,
          category: 'item',
          icon: <Package size={16} color="#fff" />,
          needsTarget,
          description: Array.isArray(item.description) ? item.description.join(' ') : item.description,
          sourceItem: item
        });
      });
    }
    
    return actions;
  }, [character]);
  
  useEffect(() => {
    if (!visible) {
      setSelectedAction(null);
      setSelectedTargetIds([]);
      setTargetDropdownOpen(false);
      setDetails('');
    } else {
      // Restore last selection when modal opens
      if (lastSelectedActionId) {
        const lastAction = availableActions.find(a => a.id === lastSelectedActionId);
        if (lastAction) {
          setSelectedAction(lastAction);
        }
      }
      
      if (lastSelectedTargetIds && lastSelectedTargetIds.length > 0) {
        // First try to restore by ID
        const validTargetIds = lastSelectedTargetIds.filter(id => 
          targets.some(target => target.id === id)
        );
        if (validTargetIds.length > 0) {
          setSelectedTargetIds(validTargetIds);
        } else if (lastSelectedTargetNames && lastSelectedTargetNames.length > 0) {
          // Fallback: restore by name if IDs don't match (e.g., due to server regeneration)
          const targetIdsByName = lastSelectedTargetNames.map(name => {
            const target = targets.find(t => t.name === name);
            return target?.id;
          }).filter(Boolean) as string[];
          
          if (targetIdsByName.length > 0) {
            setSelectedTargetIds(targetIdsByName);
          }
        }
      }
      
      // Notify parent that overlay is mounted/visible
      try { onShown && onShown(); } catch {}
    }
  }, [visible, onShown, availableActions, targets, lastSelectedActionId, lastSelectedTargetIds, lastSelectedTargetNames]);

  const canConfirm = useMemo(() => {
    if (!selectedAction) return false;
    if (selectedAction.needsTarget) return selectedTargetIds.length > 0;
    return true;
  }, [selectedAction, selectedTargetIds.length]);

  const handleClose = () => {
    try { Keyboard.dismiss(); } catch {}
    try { onClose(); } catch {}
  };

  const toggleTarget = (id: string) => {
    setSelectedTargetIds(prev => {
      const newTargetIds = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // Persist the target selection change
      if (onSelectionChange) {
        onSelectionChange(selectedAction?.id || null, newTargetIds);
      }
      return newTargetIds;
    });
    if (!selectedAction && availableActions.length > 0) {
      const defaultAction = availableActions[0];
      setSelectedAction(defaultAction);
      // Persist the action selection change
      if (onSelectionChange) {
        onSelectionChange(defaultAction.id, selectedTargetIds);
      }
    }
  };

  const renderContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Combat Actions</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <X size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { paddingBottom: 0 }]}>
        {/* Target multi-select dropdown */}
        <Text style={styles.sectionLabel}>Pick targets</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity style={styles.dropdownControl} onPress={() => setTargetDropdownOpen(o => !o)} activeOpacity={0.8}>
            <Text style={styles.dropdownText}>
              {selectedTargetIds.length > 0 ?
                targets.filter(t => selectedTargetIds.includes(t.id)).map(t => t.name).join(', ') :
                'Select targets...'}
            </Text>
          </TouchableOpacity>
          {targetDropdownOpen && (
            <View style={styles.dropdownList}>
              {loadingTargets ? (
                <View style={styles.loadingBox}><ActivityIndicator color="#fff" /></View>
              ) : (
                <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                  {targets.length === 0 ? (
                    <Text style={styles.emptyText}>No targets detected nearby.</Text>
                  ) : (
                    targets.map(t => {
                      const selected = selectedTargetIds.includes(t.id);
                      return (
                        <TouchableOpacity key={`${t.kind}:${t.id}`} style={[styles.dropdownItem, selected && styles.dropdownItemSelected]} onPress={() => toggleTarget(t.id)} activeOpacity={0.8}>
                          <View style={[styles.checkbox, selected && styles.checkboxChecked]} />
                          <Text style={styles.dropdownItemText}>{t.name} {t.kind === 'pc' ? '(ally)' : ''}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              )}
            </View>
          )}
        </View>

        {/* Actions list fills remaining space */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Choose your action</Text>
        <ScrollView style={styles.actionScrollView} nestedScrollEnabled>
          {availableActions.map(action => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, selectedAction?.id === action.id && styles.actionCardSelected]}
              onPress={() => {
                setSelectedAction(action);
                // Persist the action selection change
                if (onSelectionChange) {
                  onSelectionChange(action.id, selectedTargetIds);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.actionHeader}>
                <View style={styles.actionIcon}>
                  {action.icon}
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionName}>{action.name}</Text>
                  <Text style={styles.actionCategory}>{action.category.toUpperCase()}</Text>
                  {action.description && (
                    <Text style={styles.actionDescription} numberOfLines={2}>
                      {action.description}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Details input field */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionLabel}>Additional details (optional)</Text>
        <TextInput
          style={styles.detailsInput}
          placeholder="Describe your action in more detail..."
          placeholderTextColor="#888"
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={2}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
          disabled={!canConfirm}
          onPress={() => selectedAction && onConfirm({ action: selectedAction, targets: targets.filter(t => selectedTargetIds.includes(t.id)), details })}
        >
          <Text style={styles.confirmText}>{selectedAction?.needsTarget ? 'Confirm Action' : 'Take Action'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
      onDismiss={handleClose}
      hardwareAccelerated
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
    zIndex: 1000,
    elevation: 10,
  },
  container: { flex: 1, backgroundColor: 'rgba(18, 18, 18, 0.98)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a', paddingTop: 40 },
  title: { color: '#fff', fontFamily: 'Inter-Bold', fontSize: 18 },
  closeBtn: { padding: 8 },
  content: { flex: 1, padding: 16 },
  dropdownContainer: { marginBottom: 8 },
  dropdownControl: { backgroundColor: '#1e1e1e', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#333' },
  dropdownText: { color: '#fff', fontFamily: 'Inter-Regular' },
  dropdownList: { backgroundColor: '#1e1e1e', borderRadius: 8, marginTop: 6, borderWidth: 1, borderColor: '#333' },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  dropdownItemSelected: { backgroundColor: 'rgba(76, 175, 80, 0.08)' },
  dropdownItemText: { color: '#fff', fontFamily: 'Inter-Regular', marginLeft: 10 },
  checkbox: { width: 16, height: 16, borderRadius: 3, borderWidth: 2, borderColor: '#666', backgroundColor: 'transparent' },
  checkboxChecked: { borderColor: '#4CAF50', backgroundColor: '#4CAF50' },
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
  // New action card styles
  actionScrollView: { marginBottom: 8 },
  actionCard: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
  actionCardSelected: { borderColor: '#E91E63', backgroundColor: 'rgba(233, 30, 99, 0.1)' },
  actionHeader: { flexDirection: 'row', alignItems: 'center' },
  actionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  actionContent: { flex: 1 },
  actionName: { color: '#fff', fontFamily: 'Inter-Bold', fontSize: 14, marginBottom: 2 },
  actionCategory: { color: '#888', fontFamily: 'Inter-Regular', fontSize: 10, marginBottom: 4 },
  actionDescription: { color: '#aaa', fontFamily: 'Inter-Regular', fontSize: 11, lineHeight: 14 },
  // Details input styles
  detailsSection: { padding: 16, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  detailsInput: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 12, color: '#fff', fontFamily: 'Inter-Regular', minHeight: 60, textAlignVertical: 'top' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#2a2a2a' },
  confirmBtn: { backgroundColor: '#E91E63', borderRadius: 12, alignItems: 'center', paddingVertical: 14 },
  confirmBtnDisabled: { backgroundColor: '#666' },
  confirmText: { color: '#000', fontFamily: 'Inter-Bold', fontSize: 16 },
}); 