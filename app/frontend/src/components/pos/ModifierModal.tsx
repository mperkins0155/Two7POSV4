import { useState, useEffect } from 'react';
import { createClient } from '@metagptx/web-sdk';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Item, ModifierGroup, ModifierOption, ItemModifierGroup } from '@/types/catalog';

const client = createClient();

interface ModifierModalProps {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (modifiers: Array<{
    modifierGroupId: number;
    modifierName: string;
    optionId: number;
    optionName: string;
    priceAdjustment: number;
  }>, quantity: number) => void;
}

export function ModifierModal({ item, open, onClose, onAddToCart }: ModifierModalProps) {
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifierOptions, setModifierOptions] = useState<Record<number, ModifierOption[]>>({});
  const [selectedModifiers, setSelectedModifiers] = useState<Record<number, number[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item && open) {
      loadModifiers();
      setQuantity(1);
      setSelectedModifiers({});
    }
  }, [item, open]);

  const loadModifiers = async () => {
    if (!item) return;
    
    setLoading(true);
    try {
      // Load item-modifier-group associations
      const imgResponse = await client.entities.item_modifier_groups.query({
        query: { item_id: item.id },
        sort: 'sort_order',
        limit: 50
      });
      
      const associations = imgResponse.data.items as ItemModifierGroup[];
      
      if (associations.length === 0) {
        setModifierGroups([]);
        setModifierOptions({});
        return;
      }

      const groupIds = associations.map(a => a.modifier_group_id);
      
      // Load modifier groups
      const groupsResponse = await client.entities.modifier_groups.query({
        query: {},
        limit: 50
      });
      
      const allGroups = groupsResponse.data.items as ModifierGroup[];
      const relevantGroups = allGroups.filter(g => groupIds.includes(g.id));
      relevantGroups.sort((a, b) => {
        const aOrder = associations.find(x => x.modifier_group_id === a.id)?.sort_order || 0;
        const bOrder = associations.find(x => x.modifier_group_id === b.id)?.sort_order || 0;
        return aOrder - bOrder;
      });
      
      setModifierGroups(relevantGroups);

      // Load options for each group
      const optionsMap: Record<number, ModifierOption[]> = {};
      for (const group of relevantGroups) {
        const optionsResponse = await client.entities.modifier_options.query({
          query: { modifier_group_id: group.id, is_active: true },
          sort: 'sort_order',
          limit: 50
        });
        optionsMap[group.id] = optionsResponse.data.items;
      }
      setModifierOptions(optionsMap);

      // Set default selections for required groups
      const defaults: Record<number, number[]> = {};
      for (const group of relevantGroups) {
        if (group.is_required && group.selection_type === 'choose_one') {
          const options = optionsMap[group.id];
          if (options && options.length > 0) {
            defaults[group.id] = [options[0].id];
          }
        }
      }
      setSelectedModifiers(defaults);
    } catch (error) {
      console.error('Failed to load modifiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRadioChange = (groupId: number, optionId: number) => {
    setSelectedModifiers(prev => ({
      ...prev,
      [groupId]: [optionId]
    }));
  };

  const handleCheckboxChange = (groupId: number, optionId: number, checked: boolean) => {
    setSelectedModifiers(prev => {
      const current = prev[groupId] || [];
      if (checked) {
        return { ...prev, [groupId]: [...current, optionId] };
      } else {
        return { ...prev, [groupId]: current.filter(id => id !== optionId) };
      }
    });
  };

  const canAddToCart = () => {
    for (const group of modifierGroups) {
      const selected = selectedModifiers[group.id] || [];
      if (group.is_required && selected.length === 0) {
        return false;
      }
      if (selected.length < group.min_selections) {
        return false;
      }
      if (group.max_selections && selected.length > group.max_selections) {
        return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    const modifiers = modifierGroups.flatMap(group => {
      const selectedIds = selectedModifiers[group.id] || [];
      const options = modifierOptions[group.id] || [];
      return selectedIds.map(optionId => {
        const option = options.find(o => o.id === optionId);
        return {
          modifierGroupId: group.id,
          modifierName: group.name,
          optionId,
          optionName: option?.name || '',
          priceAdjustment: option?.price_adjustment || 0
        };
      });
    });

    onAddToCart(modifiers, quantity);
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.name}</DialogTitle>
          {item.description && (
            <p className="text-gray-600">{item.description}</p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">Loading options...</div>
        ) : modifierGroups.length === 0 ? (
          <div className="py-4">
            <p className="text-gray-600 mb-4">No customization options available.</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {modifierGroups.map(group => {
              const options = modifierOptions[group.id] || [];
              const selected = selectedModifiers[group.id] || [];

              return (
                <div key={group.id} className="border-b pb-4">
                  <h3 className="font-semibold mb-2">
                    {group.name}
                    {group.is_required && <span className="text-red-600 ml-1">*</span>}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {group.selection_type === 'choose_one' ? 'Choose one' : 
                     `Choose ${group.min_selections} to ${group.max_selections || 'many'}`}
                  </p>

                  {group.selection_type === 'choose_one' ? (
                    <RadioGroup
                      value={selected[0]?.toString()}
                      onValueChange={(value) => handleRadioChange(group.id, parseInt(value))}
                    >
                      {options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value={option.id.toString()} id={`option-${option.id}`} />
                          <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                            {option.name}
                            {option.price_adjustment !== 0 && (
                              <span className="text-gray-600 ml-2">
                                {option.price_adjustment > 0 ? '+' : ''}${option.price_adjustment.toFixed(2)}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <div className="space-y-2">
                      {options.map(option => (
                        <div key={option.id} className="flex items-center space-x-2 py-2">
                          <Checkbox
                            id={`option-${option.id}`}
                            checked={selected.includes(option.id)}
                            onCheckedChange={(checked) => 
                              handleCheckboxChange(group.id, option.id, checked as boolean)
                            }
                          />
                          <Label htmlFor={`option-${option.id}`} className="flex-1 cursor-pointer">
                            {option.name}
                            {option.price_adjustment !== 0 && (
                              <span className="text-gray-600 ml-2">
                                {option.price_adjustment > 0 ? '+' : ''}${option.price_adjustment.toFixed(2)}
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAddToCart} disabled={!canAddToCart()}>
              Add to Cart
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}