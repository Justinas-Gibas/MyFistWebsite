/**
 * Inventory System
 * 
 * Manages player inventory, equipment, item stats, and UI interactions.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.inventory = {};

(function() {
    // Inventory state
    const inventorySlots = [];
    const INVENTORY_SIZE = 24; // Default inventory size
    let maxInventorySize = INVENTORY_SIZE;
    
    // Equipment slots
    const equipment = {
        head: null,
        chest: null,
        legs: null,
        feet: null,
        hands: null,
        mainHand: null,
        offHand: null,
        necklace: null,
        ring1: null,
        ring2: null
    };
    
    // Quick slots for items accessible via number keys
    const quickSlots = [null, null, null, null, null, null]; // 6 quick slots
    
    // Equipment slot definitions
    const equipmentSlotInfo = {
        head: {
            name: "Head",
            validTypes: ["helmet", "crown", "hat"],
            icon: "head_slot_icon"
        },
        chest: {
            name: "Chest",
            validTypes: ["chest", "armor", "robe"],
            icon: "chest_slot_icon"
        },
        legs: {
            name: "Legs",
            validTypes: ["legs", "pants", "skirt"],
            icon: "legs_slot_icon"
        },
        feet: {
            name: "Feet",
            validTypes: ["feet", "boots", "shoes"],
            icon: "feet_slot_icon"
        },
        hands: {
            name: "Hands",
            validTypes: ["gloves", "gauntlets", "bracers"],
            icon: "hands_slot_icon"
        },
        mainHand: {
            name: "Main Hand",
            validTypes: ["sword", "axe", "mace", "dagger", "staff", "wand", "bow"],
            icon: "mainhand_slot_icon"
        },
        offHand: {
            name: "Off Hand",
            validTypes: ["shield", "dagger", "orb", "tome", "quiver"],
            icon: "offhand_slot_icon"
        },
        necklace: {
            name: "Necklace",
            validTypes: ["necklace", "amulet"],
            icon: "necklace_slot_icon"
        },
        ring1: {
            name: "Ring",
            validTypes: ["ring"],
            icon: "ring_slot_icon"
        },
        ring2: {
            name: "Ring",
            validTypes: ["ring"],
            icon: "ring_slot_icon"
        }
    };
    
    // Item rarity definitions
    const itemRarities = {
        common: {
            name: "Common",
            color: "#FFFFFF",
            statMultiplier: 1.0
        },
        uncommon: {
            name: "Uncommon",
            color: "#2DC50E",
            statMultiplier: 1.2
        },
        rare: {
            name: "Rare",
            color: "#0070DD",
            statMultiplier: 1.5
        },
        epic: {
            name: "Epic",
            color: "#A335EE",
            statMultiplier: 2.0
        },
        legendary: {
            name: "Legendary",
            color: "#FF8000",
            statMultiplier: 2.5
        }
    };
    
    // Initialize inventory system
    Game.gameplay.inventory.init = function() {
        console.log('Initializing inventory system');
        
        // Create initial empty inventory
        for (let i = 0; i < maxInventorySize; i++) {
            inventorySlots.push(null);
        }
        
        // Set up UI, event listeners
        setupEventListeners();
        initializeUI();
        
        return Promise.resolve();
    };
    
    // Update inventory (called each frame)
    Game.gameplay.inventory.update = function(deltaTime) {
        // Update item durability for equipped items if in use
        updateEquipmentDurability(deltaTime);
        
        // Update inventory UI occasionally
        if (Math.random() < 0.01) { // About once every 100 frames (optimization)
            refreshInventoryUI();
        }
    };
    
    // Add item to inventory
    Game.gameplay.inventory.addItem = function(item) {
        // Validate item
        if (!item || !item.id) {
            console.error('Cannot add invalid item to inventory');
            return false;
        }
        
        // If stackable, check if we already have this item type
        if (item.stackable) {
            for (let i = 0; i < inventorySlots.length; i++) {
                const existingItem = inventorySlots[i];
                if (existingItem && existingItem.type === item.type) {
                    // Stack found, increase stack size
                    if (!existingItem.stackSize) existingItem.stackSize = 1;
                    existingItem.stackSize += item.stackSize || 1;
                    
                    // Update UI
                    updateInventorySlot(i);
                    
                    // Notify
                    Game.engine.ui.showNotification(`Added ${item.name} to inventory`, 'inventory');
                    
                    return true;
                }
            }
        }
        
        // Find first empty slot
        for (let i = 0; i < inventorySlots.length; i++) {
            if (!inventorySlots[i]) {
                // Empty slot found, add item
                if (!item.stackSize && item.stackable) item.stackSize = 1;
                inventorySlots[i] = item;
                
                // Update UI
                updateInventorySlot(i);
                
                // Notify
                Game.engine.ui.showNotification(`Added ${item.name} to inventory`, 'inventory');
                
                return true;
            }
        }
        
        // No empty slot found
        Game.engine.ui.showNotification('Inventory is full!', 'error');
        return false;
    };
    
    // Add a resource to inventory
    Game.gameplay.inventory.addResource = function(resourceType, amount) {
        if (!resourceType || amount <= 0) return false;
        
        // Update game state resources
        const gameState = Game.engine.getState();
        if (!gameState.base.resources[resourceType]) {
            gameState.base.resources[resourceType] = amount;
        } else {
            gameState.base.resources[resourceType] += amount;
        }
        
        // Update game state
        Game.engine.setState(gameState);
        
        // Update resource display
        Game.engine.ui.updateResourceDisplay();
        
        return true;
    };
    
    // Remove an item from inventory
    Game.gameplay.inventory.removeItem = function(slotIndex, amount = null) {
        if (slotIndex < 0 || slotIndex >= inventorySlots.length) {
            return false;
        }
        
        const item = inventorySlots[slotIndex];
        if (!item) {
            return false;
        }
        
        // If amount specified and item is stackable, reduce stack
        if (amount && item.stackable && item.stackSize > amount) {
            item.stackSize -= amount;
            
            // Update UI
            updateInventorySlot(slotIndex);
            
            return true;
        }
        
        // Otherwise remove item completely
        inventorySlots[slotIndex] = null;
        
        // Update UI
        updateInventorySlot(slotIndex);
        
        return true;
    };
    
    // Get an item from inventory
    Game.gameplay.inventory.getItem = function(slotIndex) {
        if (slotIndex < 0 || slotIndex >= inventorySlots.length) {
            return null;
        }
        
        return inventorySlots[slotIndex];
    };
    
    // Move an item from one slot to another
    Game.gameplay.inventory.moveItem = function(fromSlot, toSlot) {
        if (fromSlot < 0 || fromSlot >= inventorySlots.length ||
            toSlot < 0 || toSlot >= inventorySlots.length) {
            return false;
        }
        
        // Get items
        const fromItem = inventorySlots[fromSlot];
        const toItem = inventorySlots[toSlot];
        
        // If fromSlot is empty, nothing to do
        if (!fromItem) {
            return false;
        }
        
        // If toSlot is empty, simple move
        if (!toItem) {
            inventorySlots[toSlot] = fromItem;
            inventorySlots[fromSlot] = null;
            
            // Update UI
            updateInventorySlot(fromSlot);
            updateInventorySlot(toSlot);
            
            return true;
        }
        
        // Check if items can be stacked
        if (fromItem.stackable && toItem.stackable && fromItem.type === toItem.type) {
            // Stack items
            toItem.stackSize = (toItem.stackSize || 1) + (fromItem.stackSize || 1);
            inventorySlots[fromSlot] = null;
            
            // Update UI
            updateInventorySlot(fromSlot);
            updateInventorySlot(toSlot);
            
            return true;
        }
        
        // Otherwise swap items
        inventorySlots[toSlot] = fromItem;
        inventorySlots[fromSlot] = toItem;
        
        // Update UI
        updateInventorySlot(fromSlot);
        updateInventorySlot(toSlot);
        
        return true;
    };
    
    // Equip an item
    Game.gameplay.inventory.equipItem = function(slotIndex) {
        if (slotIndex < 0 || slotIndex >= inventorySlots.length) {
            return false;
        }
        
        const item = inventorySlots[slotIndex];
        if (!item) {
            return false;
        }
        
        // Find appropriate equipment slot
        let equipSlot = null;
        
        // Check item category
        switch (item.category) {
            case 'helmet':
                equipSlot = 'head';
                break;
                
            case 'chest':
                equipSlot = 'chest';
                break;
                
            case 'legs':
                equipSlot = 'legs';
                break;
                
            case 'feet':
                equipSlot = 'feet';
                break;
                
            case 'gloves':
                equipSlot = 'hands';
                break;
                
            case 'weapon':
                equipSlot = 'mainHand';
                break;
                
            case 'shield':
                equipSlot = 'offHand';
                break;
                
            case 'necklace':
                equipSlot = 'necklace';
                break;
                
            case 'ring':
                // Find first empty ring slot
                if (!equipment.ring1) {
                    equipSlot = 'ring1';
                } else if (!equipment.ring2) {
                    equipSlot = 'ring2';
                } else {
                    // Both ring slots filled, replace ring1 by default
                    equipSlot = 'ring1';
                }
                break;
                
            default:
                Game.engine.ui.showNotification('Cannot equip this item', 'error');
                return false;
        }
        
        // Check if slot is valid
        if (!equipSlot || !equipmentSlotInfo[equipSlot]) {
            return false;
        }
        
        // Check if item is valid for this slot
        if (!isItemValidForSlot(item, equipSlot)) {
            Game.engine.ui.showNotification(`This item cannot be equipped in the ${equipmentSlotInfo[equipSlot].name} slot`, 'error');
            return false;
        }
        
        // Check if something is already equipped
        const currentEquipped = equipment[equipSlot];
        
        // Unequip current item if any
        if (currentEquipped) {
            const freeSlot = findFirstEmptyInventorySlot();
            if (freeSlot === -1) {
                Game.engine.ui.showNotification('Inventory is full! Cannot unequip current item.', 'error');
                return false;
            }
            
            // Move current equipped item to inventory
            inventorySlots[freeSlot] = currentEquipped;
            updateInventorySlot(freeSlot);
        }
        
        // Equip new item
        equipment[equipSlot] = item;
        inventorySlots[slotIndex] = null;
        
        // Update UI
        updateInventorySlot(slotIndex);
        updateEquipmentSlot(equipSlot);
        
        // Apply item stats
        applyEquipmentStats();
        
        // Notify
        Game.engine.ui.showNotification(`Equipped ${item.name}`, 'inventory');
        
        // Play equip sound based on item category
        playEquipSound(item.category);
        
        return true;
    };
    
    // Unequip an item
    Game.gameplay.inventory.unequipItem = function(equipSlot) {
        // Check if slot is valid
        if (!equipSlot || !equipmentSlotInfo[equipSlot]) {
            return false;
        }
        
        // Check if something is equipped in this slot
        const item = equipment[equipSlot];
        if (!item) {
            return false;
        }
        
        // Find empty inventory slot
        const emptySlot = findFirstEmptyInventorySlot();
        if (emptySlot === -1) {
            Game.engine.ui.showNotification('Inventory is full! Cannot unequip item.', 'error');
            return false;
        }
        
        // Unequip item
        equipment[equipSlot] = null;
        inventorySlots[emptySlot] = item;
        
        // Update UI
        updateEquipmentSlot(equipSlot);
        updateInventorySlot(emptySlot);
        
        // Remove item stats
        applyEquipmentStats();
        
        // Notify
        Game.engine.ui.showNotification(`Unequipped ${item.name}`, 'inventory');
        
        // Play unequip sound
        playEquipSound(item.category, true);
        
        return true;
    };
    
    // Assign an item to a quick slot
    Game.gameplay.inventory.assignToQuickSlot = function(slotIndex, quickSlotIndex) {
        if (slotIndex < 0 || slotIndex >= inventorySlots.length ||
            quickSlotIndex < 0 || quickSlotIndex >= quickSlots.length) {
            return false;
        }
        
        const item = inventorySlots[slotIndex];
        if (!item) {
            return false;
        }
        
        // Check if item is usable (consumable)
        if (item.category !== 'consumable' && item.category !== 'potion' && !item.usable) {
            Game.engine.ui.showNotification('Only consumable items can be assigned to quick slots', 'error');
            return false;
        }
        
        // Assign to quick slot (store reference to inventory slot)
        quickSlots[quickSlotIndex] = slotIndex;
        
        // Update UI
        updateQuickSlotUI(quickSlotIndex);
        
        // Notify
        Game.engine.ui.showNotification(`Assigned ${item.name} to quick slot ${quickSlotIndex + 1}`, 'inventory');
        
        return true;
    };
    
    // Use an item from a quick slot
    Game.gameplay.inventory.useQuickSlot = function(quickSlotIndex) {
        if (quickSlotIndex < 0 || quickSlotIndex >= quickSlots.length) {
            return false;
        }
        
        const inventorySlotIndex = quickSlots[quickSlotIndex];
        if (inventorySlotIndex === null) {
            return false;
        }
        
        return Game.gameplay.inventory.useItem(inventorySlotIndex);
    };
    
    // Use an item
    Game.gameplay.inventory.useItem = function(slotIndex) {
        if (slotIndex < 0 || slotIndex >= inventorySlots.length) {
            return false;
        }
        
        const item = inventorySlots[slotIndex];
        if (!item) {
            return false;
        }
        
        // Check if item is usable
        if (!item.usable && item.category !== 'consumable' && item.category !== 'potion') {
            Game.engine.ui.showNotification('This item cannot be used', 'error');
            return false;
        }
        
        // Handle different item types
        let result = false;
        
        switch (item.category) {
            case 'potion':
            case 'consumable':
                result = useConsumableItem(item);
                break;
                
            case 'scroll':
                result = useScrollItem(item);
                break;
                
            default:
                if (item.useEffect) {
                    result = useCustomItem(item);
                } else {
                    return false;
                }
        }
        
        // If item was used successfully
        if (result) {
            // Remove or reduce the item
            if (item.stackable && item.stackSize > 1) {
                item.stackSize--;
                updateInventorySlot(slotIndex);
            } else {
                // Remove item
                inventorySlots[slotIndex] = null;
                updateInventorySlot(slotIndex);
                
                // Update quick slots if needed
                for (let i = 0; i < quickSlots.length; i++) {
                    if (quickSlots[i] === slotIndex) {
                        quickSlots[i] = null;
                        updateQuickSlotUI(i);
                    }
                }
            }
            
            // Play use sound
            Game.audio.playSound(item.useSound || 'item_use');
            
            return true;
        }
        
        return false;
    };
    
    // Get the equipped tool for specific purpose
    Game.gameplay.inventory.getEquippedTool = function() {
        const mainHand = equipment.mainHand;
        
        if (mainHand && (mainHand.category === 'tool' || mainHand.type === 'axe' || mainHand.type === 'pickaxe')) {
            return mainHand;
        }
        
        return null;
    };
    
    // Get all equipped items
    Game.gameplay.inventory.getEquipment = function() {
        return { ...equipment };
    };
    
    // Get all inventory items
    Game.gameplay.inventory.getAllItems = function() {
        return [...inventorySlots];
    };
    
    // Get total equipment stats for player
    Game.gameplay.inventory.getEquipmentStats = function() {
        const stats = {
            armor: 0,
            damage: { min: 0, max: 0 },
            strength: 0,
            dexterity: 0,
            intelligence: 0,
            healthBonus: 0,
            manaBonus: 0,
            staminaBonus: 0,
            critChance: 0,
            critDamage: 0
        };
        
        // Calculate stats from all equipped items
        Object.values(equipment).forEach(item => {
            if (item && item.stats) {
                // Add basic stats
                if (item.stats.armor) stats.armor += item.stats.armor;
                if (item.stats.strength) stats.strength += item.stats.strength;
                if (item.stats.dexterity) stats.dexterity += item.stats.dexterity;
                if (item.stats.intelligence) stats.intelligence += item.stats.intelligence;
                if (item.stats.healthBonus) stats.healthBonus += item.stats.healthBonus;
                if (item.stats.manaBonus) stats.manaBonus += item.stats.manaBonus;
                if (item.stats.staminaBonus) stats.staminaBonus += item.stats.staminaBonus;
                if (item.stats.critChance) stats.critChance += item.stats.critChance;
                if (item.stats.critDamage) stats.critDamage += item.stats.critDamage;
                
                // Handle weapon damage
                if (item.stats.damage) {
                    if (stats.damage.min === 0) {
                        // First weapon damage
                        stats.damage.min = item.stats.damage.min;
                        stats.damage.max = item.stats.damage.max;
                    } else {
                        // Additional weapon (dual wield)
                        stats.damage.min += item.stats.damage.min * 0.5; // 50% effectiveness for offhand
                        stats.damage.max += item.stats.damage.max * 0.5;
                    }
                }
            }
        });
        
        return stats;
    };
    
    // Check item durability and condition
    Game.gameplay.inventory.checkItemDurability = function(item) {
        if (!item || !item.stats || item.stats.durability === undefined) {
            return 1.0; // No durability system for this item
        }
        
        if (item.stats.maxDurability === undefined) {
            item.stats.maxDurability = item.stats.durability;
        }
        
        return item.stats.durability / item.stats.maxDurability;
    };
    
    // Repair an item
    Game.gameplay.inventory.repairItem = function(slotIndex) {
        if (slotIndex < 0 || slotIndex >= inventorySlots.length) {
            return false;
        }
        
        const item = inventorySlots[slotIndex];
        if (!item) {
            return false;
        }
        
        // Check if item has durability
        if (!item.stats || item.stats.durability === undefined) {
            Game.engine.ui.showNotification('This item cannot be repaired', 'error');
            return false;
        }
        
        // Check if item needs repair
        if (item.stats.durability >= item.stats.maxDurability) {
            Game.engine.ui.showNotification('This item is already in perfect condition', 'info');
            return false;
        }
        
        // Calculate repair cost based on item value and damage
        const durabilityLost = item.stats.maxDurability - item.stats.durability;
        const repairRatio = durabilityLost / item.stats.maxDurability;
        const baseRepairCost = Math.ceil((item.value || 10) * repairRatio);
        
        // Check if player has resources
        // For simplicity, let's use gold as repair currency
        const gameState = Game.engine.getState();
        if (!gameState.player.gold || gameState.player.gold < baseRepairCost) {
            Game.engine.ui.showNotification(`Not enough gold to repair this item. Needs ${baseRepairCost}.`, 'error');
            return false;
        }
        
        // Deduct cost
        gameState.player.gold -= baseRepairCost;
        Game.engine.setState(gameState);
        
        // Repair item
        item.stats.durability = item.stats.maxDurability;
        
        // Update UI
        updateInventorySlot(slotIndex);
        
        // Notify
        Game.engine.ui.showNotification(`Repaired ${item.name} for ${baseRepairCost} gold`, 'success');
        
        // Play repair sound
        Game.audio.playSound('item_repair');
        
        return true;
    };
    
    // Generate a tooltip for an item
    Game.gameplay.inventory.generateItemTooltip = function(item) {
        if (!item) return '';
        
        let tooltip = `<div class="item-tooltip">
            <div class="item-name" style="color: ${getItemRarityColor(item)}">${item.name}</div>
            <div class="item-type">${getItemTypeText(item)}</div>`;
        
        // Add quality/rarity if available
        if (item.qualityText) {
            tooltip += `<div class="item-quality">${item.qualityText}</div>`;
        }
        
        // Add description
        if (item.description) {
            tooltip += `<div class="item-description">${item.description}</div>`;
        }
        
        // Add stats
        if (item.stats) {
            tooltip += `<div class="item-stats">`;
            
            if (item.stats.damage) {
                tooltip += `<div>Damage: ${item.stats.damage.min}-${item.stats.damage.max}</div>`;
            }
            
            if (item.stats.armor) {
                tooltip += `<div>Armor: ${item.stats.armor}</div>`;
            }
            
            if (item.stats.strength) {
                tooltip += `<div>Strength: +${item.stats.strength}</div>`;
            }
            
            if (item.stats.dexterity) {
                tooltip += `<div>Dexterity: +${item.stats.dexterity}</div>`;
            }
            
            if (item.stats.intelligence) {
                tooltip += `<div>Intelligence: +${item.stats.intelligence}</div>`;
            }
            
            if (item.stats.healthBonus) {
                tooltip += `<div>Health: +${item.stats.healthBonus}</div>`;
            }
            
            if (item.stats.manaBonus) {
                tooltip += `<div>Mana: +${item.stats.manaBonus}</div>`;
            }
            
            if (item.stats.staminaBonus) {
                tooltip += `<div>Stamina: +${item.stats.staminaBonus}</div>`;
            }
            
            // Special stats
            if (item.stats.critChance) {
                tooltip += `<div>Critical Chance: +${item.stats.critChance}%</div>`;
            }
            
            if (item.stats.critDamage) {
                tooltip += `<div>Critical Damage: +${item.stats.critDamage}%</div>`;
            }
            
            // Durability
            if (item.stats.durability !== undefined) {
                const durabilityPercent = Math.round((item.stats.durability / item.stats.maxDurability) * 100);
                let durabilityColor = '#00FF00'; // Green for good condition
                
                if (durabilityPercent < 25) {
                    durabilityColor = '#FF0000'; // Red for poor condition
                } else if (durabilityPercent < 50) {
                    durabilityColor = '#FFFF00'; // Yellow for medium condition
                }
                
                tooltip += `<div>Durability: <span style="color: ${durabilityColor}">${durabilityPercent}%</span></div>`;
            }
            
            tooltip += `</div>`;
        }
        
        // Add special effects or set bonuses
        if (item.effects && item.effects.length > 0) {
            tooltip += `<div class="item-effects">`;
            for (const effect of item.effects) {
                tooltip += `<div>${effect.description}</div>`;
            }
            tooltip += `</div>`;
        }
        
        // Add crafted by info
        if (item.crafted && item.crafterName) {
            tooltip += `<div class="item-crafter">Crafted by: ${item.crafterName}</div>`;
        }
        
        // Add value
        if (item.value) {
            tooltip += `<div class="item-value">Value: ${item.value} gold</div>`;
        }
        
        // Add requirements
        if (item.requirements) {
            tooltip += `<div class="item-requirements">`;
            if (item.requirements.level) {
                tooltip += `<div>Required Level: ${item.requirements.level}</div>`;
            }
            if (item.requirements.strength) {
                tooltip += `<div>Required Strength: ${item.requirements.strength}</div>`;
            }
            if (item.requirements.dexterity) {
                tooltip += `<div>Required Dexterity: ${item.requirements.dexterity}</div>`;
            }
            if (item.requirements.intelligence) {
                tooltip += `<div>Required Intelligence: ${item.requirements.intelligence}</div>`;
            }
            tooltip += `</div>`;
        }
        
        tooltip += `</div>`;
        
        return tooltip;
    };
    
    // Initialize inventory UI
    function initializeUI() {
        const inventoryContainer = document.getElementById('inventory-container');
        if (!inventoryContainer) return;
        
        // Clear existing content
        inventoryContainer.innerHTML = '';
        
        // Create inventory slots
        for (let i = 0; i < maxInventorySize; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.dataset.slotIndex = i;
            slot.innerHTML = '<div class="empty-slot"></div>';
            
            // Add event listeners
            slot.addEventListener('click', (e) => {
                const inventoryIndex = parseInt(e.currentTarget.dataset.slotIndex);
                handleInventorySlotClick(inventoryIndex);
            });
            
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const inventoryIndex = parseInt(e.currentTarget.dataset.slotIndex);
                handleInventorySlotRightClick(inventoryIndex);
            });
            
            // Add to container
            inventoryContainer.appendChild(slot);
        }
        
        // Create equipment slots
        const equipmentContainer = document.getElementById('equipment-container');
        if (equipmentContainer) {
            equipmentContainer.innerHTML = '';
            
            // Create slots for each equipment position
            for (const [slotKey, slotInfo] of Object.entries(equipmentSlotInfo)) {
                const slot = document.createElement('div');
                slot.className = 'equipment-slot';
                slot.dataset.equipSlot = slotKey;
                
                // Add icon for empty slot
                slot.innerHTML = `
                    <div class="empty-slot">
                        <img src="assets/ui/equipment/${slotInfo.icon}.png" alt="${slotInfo.name}">
                    </div>
                `;
                
                // Add event listener
                slot.addEventListener('click', (e) => {
                    const equipSlot = e.currentTarget.dataset.equipSlot;
                    handleEquipmentSlotClick(equipSlot);
                });
                
                // Add to container
                equipmentContainer.appendChild(slot);
            }
        }
        
        // Create quick slots
        const quickSlotContainer = document.getElementById('quickslot-container');
        if (quickSlotContainer) {
            quickSlotContainer.innerHTML = '';
            
            // Create slots for quick items
            for (let i = 0; i < quickSlots.length; i++) {
                const slot = document.createElement('div');
                slot.className = 'quick-slot';
                slot.dataset.quickSlot = i;
                slot.innerHTML = `
                    <div class="empty-slot">
                        <div class="slot-number">${i + 1}</div>
                `;
            }
        }
    }
})();
