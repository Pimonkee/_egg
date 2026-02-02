package com.yolkai.quest.model

import java.util.UUID

/**
 * Represents a full family quest session.
 */
data class Quest(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val date: Long = System.currentTimeMillis(),
    val map: QuestMap,
    val bondLevel: Int = 0 // Tracks the "Bond Recovery" stats
)

/**
 * The graph of modules that make up the quest journey.
 */
data class QuestMap(
    val modules: List<QuestModule>,
    // In a real graph, we'd have explicit connections. 
    // For now, we'll assume a linear or simple branching list.
    val currentModuleIndex: Int = 0
)

/**
 * A single unit of play (a "Level" or "Activity").
 */
data class QuestModule(
    val id: String,
    val title: String,
    val type: ModuleType,
    val narrative: String,
    val steps: List<String>, // E.g., ["Chant the spell", "Stir the pot"]
    val isCompleted: Boolean = false,
    val chaosPotential: Float = 0.5f // 0.0 to 1.0 chance of chaos
)

enum class ModuleType {
    ALCHEMY, // Cooking/Mixing
    COMBAT,  // Physical activity/Play fighting
    RITUAL,  // Chanting/Synchronized movement
    REFLECTION // Quiet time
}

/**
 * A random event that interrupts the flow.
 */
data class ChaosEvent(
    val id: String,
    val message: String,
    val action: String // Instructions for the players
)
