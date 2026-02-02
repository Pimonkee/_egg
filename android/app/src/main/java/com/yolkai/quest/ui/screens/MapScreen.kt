package com.yolkai.quest.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier

@Composable
fun MapScreen(
    onModuleSelect: (String) -> Unit
) {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        Text(text = "Quest Map Placeholder")
        
        Button(
            onClick = { onModuleSelect("module_1") },
            modifier = Modifier.align(Alignment.BottomCenter)
        ) {
            Text(text = "Enter Next Zone")
        }
    }
}
