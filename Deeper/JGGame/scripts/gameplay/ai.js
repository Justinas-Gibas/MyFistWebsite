/**
 * AI Behavior System
 * 
 * Provides artificial intelligence for NPCs and enemies
 * using behavior trees and state machines.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.ai = {};

(function() {
    // Behavior tree nodes storage
    const behaviorTrees = new Map();
    
    // Entity state storage
    const entityStates = new Map();
    
    // Pathfinding cache
    const pathCache = new Map();
    
    // Behavior tree node types
    const NodeType = {
        SELECTOR: 'selector',       // Run children until one succeeds
        SEQUENCE: 'sequence',       // Run children until all succeed or one fails
        PARALLEL: 'parallel',       // Run all children simultaneously
        CONDITION: 'condition',     // Test a condition
        ACTION: 'action',           // Perform an action
        DECORATOR: 'decorator',     // Modify child node behavior
        RANDOM: 'random'            // Pick a random child node
    };
    
    // Node result types
    const NodeResult = {
        SUCCESS: 'success',
        FAILURE: 'failure',
        RUNNING: 'running'
    };
    
    // Initialize AI system
    Game.gameplay.ai.init = function() {
        console.log('Initializing AI system');
        initializeDefaultBehaviorTrees();
        return Promise.resolve();
    };
    
    // Update AI systems (called each frame)
    Game.gameplay.ai.update = function(deltaTime) {
        // Update all entities with AI
        for (const [entityId, state] of entityStates) {
            if (state.behaviorTreeId) {
                updateEntityAI(entityId, deltaTime);
            }
        }
        
        // Clear stale path cache entries periodically
        clearStalePathCache();
    };
    
    // Assign a behavior tree to an entity
    Game.gameplay.ai.assignBehaviorTree = function(entityId, behaviorTreeId) {
        if (!entityId || !behaviorTreeId) return false;
        
        // Make sure behavior tree exists
        if (!behaviorTrees.has(behaviorTreeId)) {
            console.error(`Behavior tree not found: ${behaviorTreeId}`);
            return false;
        }
        
        // Create or update entity state
        const state = entityStates.get(entityId) || {};
        state.behaviorTreeId = behaviorTreeId;
        state.runningNodes = [];
        state.blackboard = state.blackboard || {};
        
        entityStates.set(entityId, state);
        
        return true;
    };
    
    // Create a new behavior tree
    Game.gameplay.ai.createBehaviorTree = function(id, rootNode) {
        if (!id || !rootNode) return false;
        
        behaviorTrees.set(id, rootNode);
        return true;
    };
    
    // Get entity blackboard data
    Game.gameplay.ai.getBlackboard = function(entityId) {
        const state = entityStates.get(entityId);
        if (!state) return null;
        
        return state.blackboard;
    };
    
    // Set entity blackboard data
    Game.gameplay.ai.setBlackboard = function(entityId, key, value) {
        const state = entityStates.get(entityId);
        if (!state) return false;
        
        state.blackboard[key] = value;
        return true;
    };
    
    // Find path between two points
    Game.gameplay.ai.findPath = function(start, end, options = {}) {
        // Simple straight line path for now
        // Will be replaced with proper pathfinding implementation
        return [start, end];
    };
    
    // Calculate best position for attack
    Game.gameplay.ai.calculateAttackPosition = function(attacker, target) {
        if (!attacker || !target) return null;
        
        // Get attacker and target positions
        const attackerPos = typeof attacker.getPosition === 'function' ? 
                            attacker.getPosition() : attacker.position;
        
        const targetPos = typeof target.getPosition === 'function' ?
                          target.getPosition() : target.position;
        
        if (!attackerPos || !targetPos) return null;
        
        // Calculate ideal attack range based on attacker's weapon/abilities
        const attackRange = attacker.attackRange || 2;
        
        // Calculate direction from target to attacker
        const direction = Game.utils.math.vec3.subtract(attackerPos, targetPos);
        
        // Normalize and scale to attack range
        const normalizedDir = Game.utils.math.vec3.normalize(direction);
        const attackPosition = Game.utils.math.vec3.add(
            targetPos,
            Game.utils.math.vec3.multiply(normalizedDir, attackRange)
        );
        
        return attackPosition;
    };
    
    // Check if entity can see target
    Game.gameplay.ai.canSeeTarget = function(entity, target) {
        if (!entity || !target) return false;
        
        // Get positions
        const entityPos = typeof entity.getPosition === 'function' ?
                         entity.getPosition() : entity.position;
        
        const targetPos = typeof target.getPosition === 'function' ?
                         target.getPosition() : target.position;
        
        if (!entityPos || !targetPos) return false;
        
        // Calculate distance
        const distance = Game.utils.math.vec3.distance(entityPos, targetPos);
        
        // Check if within vision range
        const visionRange = entity.visionRange || 20;
        if (distance > visionRange) return false;
        
        // Check if line of sight is clear
        // This is a simplified check - in a real implementation we would do raycasting
        return true;
    };
    
    // Private functions
    
    // Update entity AI
    function updateEntityAI(entityId, deltaTime) {
        const state = entityStates.get(entityId);
        if (!state) return;
        
        const behaviorTree = behaviorTrees.get(state.behaviorTreeId);
        if (!behaviorTree) return;
        
        // Run the behavior tree
        const result = runBehaviorTreeNode(behaviorTree, entityId, deltaTime);
        
        // Store the result if needed
        state.lastResult = result;
    }
    
    // Run a behavior tree node
    function runBehaviorTreeNode(node, entityId, deltaTime) {
        if (!node) return NodeResult.FAILURE;
        
        const state = entityStates.get(entityId);
        if (!state) return NodeResult.FAILURE;
        
        // Handle different node types
        switch (node.type) {
            case NodeType.SELECTOR:
                return runSelectorNode(node, entityId, deltaTime);
                
            case NodeType.SEQUENCE:
                return runSequenceNode(node, entityId, deltaTime);
                
            case NodeType.PARALLEL:
                return runParallelNode(node, entityId, deltaTime);
                
            case NodeType.CONDITION:
                return runConditionNode(node, entityId, deltaTime);
                
            case NodeType.ACTION:
                return runActionNode(node, entityId, deltaTime);
                
            case NodeType.DECORATOR:
                return runDecoratorNode(node, entityId, deltaTime);
                
            case NodeType.RANDOM:
                return runRandomNode(node, entityId, deltaTime);
                
            default:
                console.error(`Unknown node type: ${node.type}`);
                return NodeResult.FAILURE;
        }
    }
    
    // Run a selector node (OR logic)
    function runSelectorNode(node, entityId, deltaTime) {
        if (!node.children || node.children.length === 0) {
            return NodeResult.FAILURE;
        }
        
        for (const child of node.children) {
            const result = runBehaviorTreeNode(child, entityId, deltaTime);
            
            if (result === NodeResult.SUCCESS) {
                return NodeResult.SUCCESS;
            }
            
            if (result === NodeResult.RUNNING) {
                return NodeResult.RUNNING;
            }
        }
        
        return NodeResult.FAILURE;
    }
    
    // Run a sequence node (AND logic)
    function runSequenceNode(node, entityId, deltaTime) {
        if (!node.children || node.children.length === 0) {
            return NodeResult.SUCCESS;
        }
        
        const state = entityStates.get(entityId);
        state.currentSequenceIndex = state.currentSequenceIndex || 0;
        
        while (state.currentSequenceIndex < node.children.length) {
            const child = node.children[state.currentSequenceIndex];
            const result = runBehaviorTreeNode(child, entityId, deltaTime);
            
            if (result === NodeResult.FAILURE) {
                state.currentSequenceIndex = 0;
                return NodeResult.FAILURE;
            }
            
            if (result === NodeResult.RUNNING) {
                return NodeResult.RUNNING;
            }
            
            // Success, move to next child
            state.currentSequenceIndex++;
        }
        
        // All children succeeded
        state.currentSequenceIndex = 0;
        return NodeResult.SUCCESS;
    }
    
    // Run a parallel node (run all children simultaneously)
    function runParallelNode(node, entityId, deltaTime) {
        if (!node.children || node.children.length === 0) {
            return NodeResult.SUCCESS;
        }
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const child of node.children) {
            const result = runBehaviorTreeNode(child, entityId, deltaTime);
            
            if (result === NodeResult.SUCCESS) {
                successCount++;
            } else if (result === NodeResult.FAILURE) {
                failureCount++;
            }
        }
        
        // Check success/failure policy
        const requiredSuccesses = node.requiredSuccesses || node.children.length;
        const allowedFailures = node.allowedFailures || 0;
        
        if (failureCount > allowedFailures) {
            return NodeResult.FAILURE;
        }
        
        if (successCount >= requiredSuccesses) {
            return NodeResult.SUCCESS;
        }
        
        return NodeResult.